import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  SearchRequestSchema,
  type SearchRequest,
  type SearchResult,
} from "@/lib/validation";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import {
  buildSearchKey,
  getCachedSearchResultByKey,
  getCachedSearchResultById,
  getSearchIdForKey,
  setSearchKeyForId,
} from "@/lib/cache";
import { applyRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { assembleSearchResultFromDB } from "@/lib/db-helpers";

function getClientIp(req: NextRequest): string {
  const header = req.headers.get("x-forwarded-for");
  if (header) {
    const ip = header.split(",")[0]?.trim();
    if (ip) return ip;
  }
  // Next.js on Vercel exposes req.ip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyReq = req as any;
  if (typeof anyReq.ip === "string" && anyReq.ip.length > 0) {
    return anyReq.ip;
  }
  return "unknown";
}

async function enforceRateLimits(
  req: NextRequest,
  input: SearchRequest
): Promise<{ error: NextResponse | null; headers: Record<string, string> }> {
  const ip = getClientIp(req);

  // Per-IP limit: 20 searches per 10 minutes
  const ipLimit = await applyRateLimit({
    identifier: ip,
    maxRequests: 20,
    windowSeconds: 60 * 10,
    prefix: "rate:ip",
  });

  const ipHeaders = getRateLimitHeaders(ipLimit);

  if (!ipLimit.allowed) {
    return {
      error: NextResponse.json(
        {
          error: "Too many requests from this IP. Please slow down.",
        },
        {
          status: 429,
          headers: {
            ...ipHeaders,
            "Retry-After": String(
              Math.max(1, Math.round((ipLimit.resetAt - Date.now()) / 1000))
            ),
          },
        }
      ),
      headers: ipHeaders,
    };
  }

  // Per-topic limit: 10 searches per minute
  const searchKey = buildSearchKey(input);
  const topicLimit = await applyRateLimit({
    identifier: searchKey,
    maxRequests: 10,
    windowSeconds: 60,
    prefix: "rate:topic",
  });

  if (!topicLimit.allowed) {
    return {
      error: NextResponse.json(
        {
          error:
            "This topic is being searched too frequently. Please wait a moment.",
        },
        {
          status: 429,
          headers: {
            ...ipHeaders,
            "X-RateLimit-Remaining-Topic": String(topicLimit.remaining),
          },
        }
      ),
      headers: ipHeaders,
    };
  }

  return { error: null, headers: ipHeaders };
}

/**
 * Trigger the scrape_and_analyze edge function
 * Returns true if successfully triggered (doesn't wait for completion)
 */
async function triggerEdgeFunction(searchId: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[triggerEdgeFunction] Missing Supabase configuration");
    return false;
  }

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/scrape_and_analyze`;

  try {
    // Fire and forget - don't wait for completion
    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ searchId }),
      // Don't wait forever for edge function
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) {
      console.error(
        `[triggerEdgeFunction] Edge function returned ${response.status}`
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error("[triggerEdgeFunction] Failed to invoke edge function", err);
    return false;
  }
}

/**
 * Short-poll for search results, checking cache and DB
 * Returns result if ready within maxWaitMs, otherwise null
 */
async function shortPollForResults(
  searchId: string,
  maxWaitMs: number = 8000
): Promise<SearchResult | null> {
  const startTime = Date.now();
  const pollInterval = 500; // Check every 500ms
  const supabase = getSupabaseServiceClient();

  while (Date.now() - startTime < maxWaitMs) {
    // Check cache first (fastest)
    const cached = await getCachedSearchResultById(searchId);
    if (cached && cached.status === "completed") {
      return cached;
    }

    // Check DB status
    const { data: search } = await supabase
      .from("searches")
      .select("id, status, error_message")
      .eq("id", searchId)
      .single();

    if (!search) {
      console.error(`[shortPollForResults] Search ${searchId} not found in DB`);
      return null;
    }

    if (search.status === "completed") {
      // Try cache again (might have been written while we checked DB)
      const cachedAfter = await getCachedSearchResultById(searchId);
      if (cachedAfter) {
        return cachedAfter;
      }

      // Fallback: assemble from DB
      return await assembleSearchResultFromDB(searchId, supabase);
    }

    if (search.status === "failed") {
      return {
        searchId,
        status: "failed",
        topic: "",
        tags: [],
        timeRange: "month",
        minUpvotes: 0,
        sortBy: "relevance",
        painPoints: [],
        quotes: [],
        ...(search.error_message && { errorMessage: search.error_message }),
      } as SearchResult;
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SearchRequestSchema.parse(body);

    // Enforce rate limits
    const { error: rateLimitError, headers: rateLimitHeaders } =
      await enforceRateLimits(request, parsed);

    if (rateLimitError) {
      return rateLimitError;
    }

    const searchKey = buildSearchKey(parsed);

    // 1) Check Redis for fully cached result
    const cached = await getCachedSearchResultByKey(searchKey);
    if (cached) {
      console.log(`[POST /api/search] Cache hit for searchKey: ${searchKey}`);
      return NextResponse.json(cached, {
        status: 200,
        headers: rateLimitHeaders,
      });
    }

    const supabase = getSupabaseServiceClient();

    // 2) Check if recent searchId exists for this searchKey
    const existingSearchId = await getSearchIdForKey(searchKey);
    if (existingSearchId) {
      console.log(
        `[POST /api/search] Found existing searchId: ${existingSearchId}`
      );

      // Check cache by ID
      const cachedById = await getCachedSearchResultById(existingSearchId);
      if (cachedById && cachedById.status === "completed") {
        return NextResponse.json(cachedById, {
          status: 200,
          headers: rateLimitHeaders,
        });
      }

      // Check DB
      const { data: existingSearch } = await supabase
        .from("searches")
        .select("id, status, error_message")
        .eq("id", existingSearchId)
        .single();

      if (existingSearch) {
        // If still processing, trigger edge function again (idempotent)
        if (
          existingSearch.status === "processing" ||
          existingSearch.status === "pending"
        ) {
          await triggerEdgeFunction(existingSearchId);
        }

        return NextResponse.json(
          {
            searchId: existingSearch.id,
            status: existingSearch.status,
            ...(existingSearch.error_message && {
              errorMessage: existingSearch.error_message,
            }),
          },
          { status: 202, headers: rateLimitHeaders }
        );
      }
    }

    // 3) Create new search row
    console.log(
      `[POST /api/search] Creating new search for topic: ${parsed.topic}`
    );

    const { data, error } = await supabase
      .from("searches")
      .insert({
        topic: parsed.topic.toLowerCase(),
        subreddits: parsed.tags && parsed.tags.length > 0 ? parsed.tags : null,
        time_range: parsed.timeRange,
        min_upvotes: parsed.minUpvotes,
        sort_by: parsed.sortBy,
        status: "processing",
      })
      .select("id, status")
      .single();

    if (error || !data) {
      console.error("[POST /api/search] Error inserting search:", error);
      return NextResponse.json(
        { error: "Failed to create search" },
        { status: 500, headers: rateLimitHeaders }
      );
    }

    // Map searchKey -> searchId in Redis (best-effort)
    setSearchKeyForId(searchKey, data.id).catch((err) => {
      console.error("[POST /api/search] Failed to set searchKey mapping:", err);
    });

    // 4) Trigger edge function
    const triggered = await triggerEdgeFunction(data.id);
    if (!triggered) {
      console.warn(
        `[POST /api/search] Edge function trigger failed for ${data.id}`
      );
      // Don't fail the request - edge function might still pick it up via pg_cron
    }

    // 5) Short-poll for results (up to 8 seconds)
    const pollResult = await shortPollForResults(data.id, 8000);

    if (pollResult && pollResult.status === "completed") {
      return NextResponse.json(pollResult, {
        status: 200,
        headers: rateLimitHeaders,
      });
    }

    // Return processing status if not ready yet
    return NextResponse.json(
      {
        searchId: data.id,
        status: pollResult?.status || "processing",
      },
      { status: 202, headers: rateLimitHeaders }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          issues: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    console.error("[POST /api/search] Unexpected error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
