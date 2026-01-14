import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { getCachedSearchResultById } from "@/lib/cache";
import { SearchResultSchema, type SearchResult } from "@/lib/validation";

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
    const result: SearchResult = {
      searchId: search.id,
      status: search.status as "pending" | "processing" | "completed" | "failed",
      topic: search.topic,
      tags: Array.isArray(search.subreddits) ? (search.subreddits as string[]) : [],
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
    return NextResponse.json(cached, { status: 200 });
  }

  // 2) Fallback to DB - assemble full result if completed
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("searches")
    .select("id, status, error_message")
    .eq("id", searchId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Search not found" }, { status: 404 });
  }

  // If completed, try to assemble full result from DB
  if (data.status === "completed") {
    const assembled = await assembleSearchResultFromDB(searchId, supabase);
    if (assembled) {
      return NextResponse.json(assembled, { status: 200 });
    }
  }

  // Return status-only response for pending/processing/failed
  return NextResponse.json({
    searchId: data.id,
    status: data.status,
    errorMessage: data.error_message,
  });
}
