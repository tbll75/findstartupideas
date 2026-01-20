import { NextRequest } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { getCachedSearchResultById } from "@/lib/redis";
import { assembleSearchResultFromDB } from "@/lib/db";
import {
  successResponse,
  badRequestErrorResponse,
  notFoundErrorResponse,
  internalErrorResponse,
  searchFailedResponse,
} from "@/lib/api";
import { getQueryParam } from "@/lib/api/request-utils";

export async function GET(request: NextRequest) {
  const searchId = getQueryParam(request, "searchId");

  if (!searchId) {
    return badRequestErrorResponse("Missing required query parameter: searchId");
  }

  try {
    // 1) Try to return fully cached result (fastest path)
    const cached = await getCachedSearchResultById(searchId);
    if (cached) {
      console.log(`[GET /api/search-status] Cache hit for ${searchId}`);
      return successResponse(cached);
    }

    // 2) Fallback to DB
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from("searches")
      .select("id, status, error_message")
      .eq("id", searchId)
      .maybeSingle();

    if (error) {
      console.error(
        `[GET /api/search-status] DB error for ${searchId}:`,
        error
      );
      return internalErrorResponse("Failed to fetch search status");
    }

    if (!data) {
      return notFoundErrorResponse("Search not found");
    }

    // If completed, assemble full result from DB
    if (data.status === "completed") {
      const assembled = await assembleSearchResultFromDB(searchId, supabase);

      if (assembled) {
        console.log(
          `[GET /api/search-status] Assembled result from DB for ${searchId}`
        );
        return successResponse(assembled);
      }

      // If assembly fails, still return status
      console.warn(
        `[GET /api/search-status] Failed to assemble result for ${searchId}`
      );
    }

    // Return status-only response for pending/processing/failed or assembly failure
    if (data.status === "failed") {
      return searchFailedResponse(
        data.id,
        data.error_message || "Search failed"
      );
    }

    return successResponse({
      searchId: data.id,
      status: data.status,
      ...(data.error_message && { errorMessage: data.error_message }),
    });
  } catch (error) {
    console.error(
      `[GET /api/search-status] Unexpected error for ${searchId}:`,
      error
    );
    return internalErrorResponse();
  }
}
