import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { SearchRequestSchema, type SearchRequest, SearchResultSchema, type SearchResult, hnTagsEnum } from "@/lib/validation";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import {
  buildSearchKey,
  getCachedSearchResultByKey,
  getCachedSearchResultById,
  getSearchIdForKey,
  setSearchKeyForId,
} from "@/lib/cache";
import { applyRateLimit } from "@/lib/rate-limit";

function getClientIp(req: NextRequest): string {
  const header = req.headers.get("x-forwarded-for");
  if (header) {
    const ip = header.split(",")[0]?.trim();
    if (ip) return ip;
  }
  // Next.js on Vercel exposes req.ip in many environments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyReq = req as any;
  if (typeof anyReq.ip === "string" && anyReq.ip.length > 0) {
    return anyReq.ip;
  }
  return "unknown";
}

async function enforceRateLimits(req: NextRequest, input: SearchRequest) {
  const ip = getClientIp(req);

  // Per-IP limit: e.g. 20 searches per 10 minutes
  const ipLimit = await applyRateLimit({
    identifier: ip,
    maxRequests: 20,
    windowSeconds: 60 * 10,
    prefix: "rate:ip",
  });

  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests from this IP, please slow down.",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(ipLimit.totalHits),
          "X-RateLimit-Remaining": String(ipLimit.remaining),
          "Retry-After": String(
            Math.max(1, Math.round((ipLimit.resetAt - Date.now()) / 1000))
          ),
        },
      }
    );
  }

  // Optional per-topic (per-searchKey) soft limit
  const searchKey = buildSearchKey(input);
  const topicLimit = await applyRateLimit({
    identifier: searchKey,
    maxRequests: 10,
    windowSeconds: 60,
    prefix: "rate:topic",
  });

  if (!topicLimit.allowed) {
    return NextResponse.json(
      {
        error:
          "This topic is being searched too frequently. Please wait a bit before trying again.",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining-Topic": String(topicLimit.remaining),
        },
      }
    );
  }

  return null;
}

/**
 * Trigger the scrape_and_analyze edge function
 */
async function triggerEdgeFunction(searchId: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration");
  }

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/scrape_and_analyze`;
  
  // Fire and forget - don't wait for completion
  fetch(edgeFunctionUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ searchId }),
  }).catch((err) => {
    console.error("[triggerEdgeFunction] Failed to invoke edge function", err);
  });
}

/**
 * Short-poll for search results, checking cache and DB
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
      return null;
    }

    if (search.status === "completed") {
      // Try to fetch from cache again (might have been written while we checked)
      const cachedAfter = await getCachedSearchResultById(searchId);
      if (cachedAfter) {
        return cachedAfter;
      }

      // If not in cache, assemble from DB (fallback)
      return await assembleSearchResultFromDB(searchId, supabase);
    }

    if (search.status === "failed") {
      // Return a failed result
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

/**
 * Assemble SearchResult from database tables (fallback when cache misses)
 */
async function assembleSearchResultFromDB(
  searchId: string,
  supabase: ReturnType<typeof getSupabaseServiceClient>
): Promise<SearchResult | null> {
  try {
    // Fetch search row
    const { data: search } = await supabase
      .from("searches")
      .select("*")
      .eq("id", searchId)
      .single();

    if (!search) return null;

    // Fetch search_results
    const { data: searchResults } = await supabase
      .from("search_results")
      .select("*")
      .eq("search_id", searchId)
      .single();

    // Fetch pain_points
    const { data: painPoints } = await supabase
      .from("pain_points")
      .select("*")
      .eq("search_id", searchId);

    // Fetch quotes (join through pain_points)
    const painPointIds = (painPoints || []).map((pp) => pp.id);
    const { data: quotes } = painPointIds.length > 0
      ? await supabase
          .from("pain_point_quotes")
          .select("*")
          .in("pain_point_id", painPointIds)
      : { data: [] };

    // Fetch AI analysis
    const { data: analysis } = await supabase
      .from("ai_analyses")
      .select("*")
      .eq("search_id", searchId)
      .single();

    // Assemble result
    // Validate and filter tags to ensure they match the HN tags enum
    const validTags = Array.isArray(search.subreddits)
      ? search.subreddits.filter((tag: unknown): tag is z.infer<typeof hnTagsEnum> =>
          typeof tag === "string" && hnTagsEnum.safeParse(tag).success
        )
      : [];

    const result: SearchResult = {
      searchId: search.id,
      status: search.status as "pending" | "processing" | "completed" | "failed",
      topic: search.topic,
      tags: validTags,
      timeRange: search.time_range as "week" | "month" | "year" | "all",
      minUpvotes: search.min_upvotes,
      sortBy: search.sort_by as "relevance" | "upvotes" | "recency",
      totalMentions: searchResults?.total_mentions ?? undefined,
      totalPostsConsidered: searchResults?.total_posts_considered ?? undefined,
      totalCommentsConsidered: searchResults?.total_comments_considered ?? undefined,
      sourceTags: searchResults?.source_tags ?? undefined,
      painPoints: (painPoints || []).map((pp) => ({
        id: pp.id,
        searchId: pp.search_id,
        title: pp.title,
        sourceTag: pp.subreddit, // Using subreddit column for HN tag
        mentionsCount: pp.mentions_count,
        severityScore: pp.severity_score ? Number(pp.severity_score) : undefined,
      })),
      quotes: (quotes || []).map((q) => ({
        id: q.id,
        painPointId: q.pain_point_id,
        quoteText: q.quote_text,
        authorHandle: q.author_handle,
        upvotes: q.upvotes,
        permalink: q.permalink,
      })),
      analysis: analysis
        ? {
            summary: analysis.summary,
            problemClusters: Array.isArray(analysis.problem_clusters)
              ? analysis.problem_clusters
              : [],
            productIdeas: Array.isArray(analysis.product_ideas)
              ? analysis.product_ideas
              : [],
            model: analysis.model ?? undefined,
            tokensUsed: analysis.tokens_used ?? undefined,
          }
        : undefined,
    };

    return SearchResultSchema.parse(result);
  } catch (error) {
    console.error("[assembleSearchResultFromDB] Failed to assemble result", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SearchRequestSchema.parse(body);

    // Enforce IP + topic-based rate limits
    const rateLimitResponse = await enforceRateLimits(request, parsed);
    if (rateLimitResponse) return rateLimitResponse;

    const searchKey = buildSearchKey(parsed);

    // 1) Check Redis for a fully cached result for this searchKey
    const cached = await getCachedSearchResultByKey(searchKey);
    if (cached) {
      return NextResponse.json(cached, { status: 200 });
    }

    const supabase = getSupabaseServiceClient();

    // 2) If a recent searchId exists for this searchKey, reuse it
    const existingSearchId = await getSearchIdForKey(searchKey);
    if (existingSearchId) {
      // Check cache first
      const cachedById = await getCachedSearchResultById(existingSearchId);
      if (cachedById && cachedById.status === "completed") {
        return NextResponse.json(cachedById, { status: 200 });
      }

      const { data: existingSearch } = await supabase
        .from("searches")
        .select("id, status")
        .eq("id", existingSearchId)
        .single();

      if (existingSearch) {
        // If still processing, trigger edge function again (idempotent)
        if (existingSearch.status === "processing" || existingSearch.status === "pending") {
          await triggerEdgeFunction(existingSearchId).catch((err) => {
            console.error("Failed to trigger edge function for existing search", err);
          });
        }
        return NextResponse.json(
          {
            searchId: existingSearch.id,
            status: existingSearch.status,
          },
          { status: 202 }
        );
      }
    }

    // 3) Create a new search row and map searchKey -> searchId in Redis
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
      console.error("Error inserting search:", error);
      return NextResponse.json(
        { error: "Failed to create search" },
        { status: 500 }
      );
    }

    // Best-effort mapping; failures here shouldn't break the request
    setSearchKeyForId(searchKey, data.id).catch((err) => {
      console.error("Failed to set searchKey mapping in Redis", err);
    });

    // 4) Trigger the edge function to start processing
    await triggerEdgeFunction(data.id).catch((err) => {
      console.error("Failed to trigger edge function", err);
      // Don't fail the request if edge function trigger fails
    });

    // 5) Short-poll for results (up to 8 seconds)
    const pollResult = await shortPollForResults(data.id, 8000);
    
    if (pollResult && pollResult.status === "completed") {
      return NextResponse.json(pollResult, { status: 200 });
    }

    // Return processing status if not ready yet
    return NextResponse.json(
      {
        searchId: data.id,
        status: pollResult?.status || "processing",
      },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          issues: error.flatten(),
        },
        { status: 400 }
      );
    }

    console.error("Error in /api/search:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
