/**
 * Search Polling
 * Server-side polling for search results
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { SearchResult } from "@/types";
import { getCachedSearchResultById } from "@/lib/redis";
import { assembleSearchResultFromDB } from "@/lib/db";
import {
  SHORT_POLL_MAX_WAIT_MS,
  SHORT_POLL_INTERVAL_MS,
} from "@/shared/constants";

type DbClient = SupabaseClient<Database>;

/**
 * Short-poll for search results
 * Checks cache and DB periodically until results are ready or timeout
 *
 * @param searchId - UUID of the search
 * @param supabase - Supabase client
 * @param maxWaitMs - Maximum time to wait (default: 8 seconds)
 * @returns SearchResult if ready, null if timed out
 */
export async function shortPollForResults(
  searchId: string,
  supabase: DbClient,
  maxWaitMs: number = SHORT_POLL_MAX_WAIT_MS
): Promise<SearchResult | null> {
  const startTime = Date.now();
  const pollInterval = SHORT_POLL_INTERVAL_MS;

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
