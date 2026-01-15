import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { getCachedSearchResultById } from "@/lib/cache";
import { assembleSearchResultFromDB } from "@/lib/db-helpers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchId = searchParams.get("searchId");

  if (!searchId) {
    return NextResponse.json(
      { error: "Missing required query parameter: searchId" },
      { status: 400 }
    );
  }

  try {
    // 1) Try to return fully cached result (fastest path)
    const cached = await getCachedSearchResultById(searchId);
    if (cached) {
      console.log(`[GET /api/search-status] Cache hit for ${searchId}`);
      return NextResponse.json(cached, { status: 200 });
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
      return NextResponse.json(
        { error: "Failed to fetch search status" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Search not found" }, { status: 404 });
    }

    // If completed, assemble full result from DB
    if (data.status === "completed") {
      const assembled = await assembleSearchResultFromDB(searchId, supabase);

      if (assembled) {
        console.log(
          `[GET /api/search-status] Assembled result from DB for ${searchId}`
        );
        return NextResponse.json(assembled, { status: 200 });
      }

      // If assembly fails, still return status
      console.warn(
        `[GET /api/search-status] Failed to assemble result for ${searchId}`
      );
    }

    // Return status-only response for pending/processing/failed or assembly failure
    const response: {
      searchId: string;
      status: string;
      errorMessage?: string;
    } = {
      searchId: data.id,
      status: data.status,
    };

    if (data.error_message) {
      response.errorMessage = data.error_message;
    }

    return NextResponse.json(response, {
      status: data.status === "failed" ? 500 : 200,
    });
  } catch (error) {
    console.error(
      `[GET /api/search-status] Unexpected error for ${searchId}:`,
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
