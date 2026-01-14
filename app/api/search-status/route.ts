import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { getCachedSearchResultById } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchId = searchParams.get("searchId");

  if (!searchId) {
    return NextResponse.json(
      { error: "Missing required query parameter: searchId" },
      { status: 400 }
    );
  }

  // 1) Prefer returning a fully cached result if available
  const cached = await getCachedSearchResultById(searchId);
  if (cached) {
    return NextResponse.json({
      searchId: cached.searchId,
      status: cached.status,
      result: cached,
    });
  }

  // 2) Fallback to DB-only status
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("searches")
    .select("id, status, error_message")
    .eq("id", searchId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Search not found" }, { status: 404 });
  }

  return NextResponse.json({
    searchId: data.id,
    status: data.status,
    errorMessage: data.error_message,
  });
}
