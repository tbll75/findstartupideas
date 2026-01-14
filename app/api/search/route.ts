import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { SearchRequestSchema, type SearchRequest } from "@/lib/validation";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import {
  buildSearchKey,
  getCachedSearchResultByKey,
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
      const { data: existingSearch } = await supabase
        .from("searches")
        .select("id, status")
        .eq("id", existingSearchId)
        .single();

      if (existingSearch) {
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
        subreddits:
          parsed.subreddits && parsed.subreddits.length > 0
            ? parsed.subreddits
            : null,
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

    return NextResponse.json(
      {
        searchId: data.id,
        status: data.status,
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
