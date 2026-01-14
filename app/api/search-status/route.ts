import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchId = searchParams.get("searchId");

  if (!searchId) {
    return NextResponse.json(
      { error: "Missing required query parameter: searchId" },
      { status: 400 }
    );
  }

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
