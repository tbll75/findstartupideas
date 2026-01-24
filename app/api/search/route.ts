import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { SearchRequestSchema } from "@/lib/schemas";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import {
  getCachedSearchResultByKey,
  getCachedSearchResultById,
  setSearchKeyForId,
} from "@/lib/redis";
import { buildSearchKey } from "@/shared";
import {
  enforceSearchRateLimits,
  shortPollForResults,
  triggerEdgeFunction,
} from "@/lib/search";
import {
  validationErrorResponse,
  internalErrorResponse,
  successResponse,
  searchProcessingResponse,
} from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SearchRequestSchema.parse(body);

    // Enforce rate limits
    const { error: rateLimitError, headers: rateLimitHeaders } =
      await enforceSearchRateLimits(request, parsed);

    if (rateLimitError) {
      return rateLimitError;
    }

    const searchKey = buildSearchKey(parsed);

    // 1) Check Redis for fully cached result
    const cached = await getCachedSearchResultByKey(searchKey);
    if (cached) {
      console.log(`[POST /api/search] Cache hit for searchKey: ${searchKey}`);
      return successResponse(cached, rateLimitHeaders);
    }

    const supabase = getSupabaseServiceClient();

    // 2) Check if recent searchId exists for this searchKey (via Redis mapping)
    // This is handled by checking the cache first above

    // 3) Check DB for existing search with same key
    const { data: existingSearches } = await supabase
      .from("searches")
      .select("id, status, error_message")
      .eq("topic", parsed.topic.toLowerCase())
      .eq("time_range", parsed.timeRange)
      .eq("min_upvotes", parsed.minUpvotes)
      .eq("sort_by", parsed.sortBy)
      .in("status", ["processing", "pending", "completed"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingSearches && existingSearches.length > 0) {
      const existingSearch = existingSearches[0];

      // Check cache by ID
      const cachedById = await getCachedSearchResultById(existingSearch.id);
      if (cachedById && cachedById.status === "completed") {
        return successResponse(cachedById, rateLimitHeaders);
      }

      // If still processing or pending, trigger edge function again (idempotent) and return status
      if (
        existingSearch.status === "processing" ||
        existingSearch.status === "pending"
      ) {
        // Re-trigger edge function in case it failed or is stuck
        triggerEdgeFunction(existingSearch.id);
        return searchProcessingResponse(
          existingSearch.id,
          existingSearch.status as "pending" | "processing",
          rateLimitHeaders
        );
      }

      // If completed, try to assemble from DB
      if (existingSearch.status === "completed") {
        const result = await shortPollForResults(existingSearch.id, supabase, 1000);
        if (result && result.status === "completed") {
          return successResponse(result, rateLimitHeaders);
        }
      }
    }

    // 4) Create new search row
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
        status: "pending", // Queue-based: pg_cron will pick this up and trigger edge function
      })
      .select("id, status")
      .single();

    if (error || !data) {
      console.error("[POST /api/search] Error inserting search:", error);
      return internalErrorResponse("Failed to create search");
    }

    // Map searchKey -> searchId in Redis (best-effort)
    setSearchKeyForId(searchKey, data.id).catch((err) => {
      console.error("[POST /api/search] Failed to set searchKey mapping:", err);
    });

    // Trigger edge function immediately for responsiveness
    // pg_cron serves as a backup to pick up any searches that fail or get stuck
    const triggered = await triggerEdgeFunction(data.id);
    if (triggered) {
      // Update status to processing since we triggered it
      await supabase
        .from("searches")
        .update({ status: "processing" })
        .eq("id", data.id);
    }
    // If trigger fails, pg_cron will pick it up within 1 minute (status remains "pending")

    // 5) Short-poll for results (up to 8 seconds)
    const pollResult = await shortPollForResults(data.id, supabase);

    if (pollResult && pollResult.status === "completed") {
      return successResponse(pollResult, rateLimitHeaders);
    }

    // Return processing status if not ready yet
    // Client will poll /api/search-status until complete
    return searchProcessingResponse(
      data.id,
      (pollResult?.status as "pending" | "processing") || "processing",
      rateLimitHeaders
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("[POST /api/search] Unexpected error:", error);
    return internalErrorResponse();
  }
}
