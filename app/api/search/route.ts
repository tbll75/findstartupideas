import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { SearchRequestSchema } from "@/lib/validation";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SearchRequestSchema.parse(body);

    const supabase = getSupabaseServiceClient();

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
