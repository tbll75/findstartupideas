/**
 * Shared database helper functions
 * Used by both API routes and edge functions
 */

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SearchResultSchema,
  type SearchResult,
  hnTagsEnum,
} from "@/lib/validation";

/**
 * Assemble SearchResult from database tables
 * Used as fallback when cache misses or for status polling
 */
export async function assembleSearchResultFromDB(
  searchId: string,
  supabase: SupabaseClient
): Promise<SearchResult | null> {
  try {
    // Fetch search row
    const { data: search, error: searchError } = await supabase
      .from("searches")
      .select("*")
      .eq("id", searchId)
      .single();

    if (searchError || !search) {
      console.error(
        `[assembleSearchResultFromDB] Search not found: ${searchId}`,
        searchError
      );
      return null;
    }

    // Fetch search_results
    const { data: searchResults } = await supabase
      .from("search_results")
      .select("*")
      .eq("search_id", searchId)
      .maybeSingle();

    // Fetch pain_points
    const { data: painPoints } = await supabase
      .from("pain_points")
      .select("*")
      .eq("search_id", searchId)
      .order("severity_score", { ascending: false, nullsFirst: false })
      .order("mentions_count", { ascending: false });

    // Fetch quotes
    const painPointIds = (painPoints || []).map((pp) => pp.id);
    const { data: quotes } =
      painPointIds.length > 0
        ? await supabase
            .from("pain_point_quotes")
            .select("*")
            .in("pain_point_id", painPointIds)
            .order("upvotes", { ascending: false })
        : { data: [] };

    // Fetch AI analysis
    const { data: analysis } = await supabase
      .from("ai_analyses")
      .select("*")
      .eq("search_id", searchId)
      .maybeSingle();

    // Validate and filter tags to match HN tags enum
    const validTags = Array.isArray(search.subreddits)
      ? search.subreddits.filter(
          (tag: unknown): tag is z.infer<typeof hnTagsEnum> =>
            typeof tag === "string" && hnTagsEnum.safeParse(tag).success
        )
      : [];

    // Assemble result
    const result: SearchResult = {
      searchId: search.id,
      status: search.status as
        | "pending"
        | "processing"
        | "completed"
        | "failed",
      topic: search.topic,
      tags: validTags,
      timeRange: search.time_range as "week" | "month" | "year" | "all",
      minUpvotes: search.min_upvotes,
      sortBy: search.sort_by as "relevance" | "upvotes" | "recency",
      totalMentions: searchResults?.total_mentions ?? undefined,
      totalPostsConsidered: searchResults?.total_posts_considered ?? undefined,
      totalCommentsConsidered:
        searchResults?.total_comments_considered ?? undefined,
      sourceTags: searchResults?.source_tags ?? undefined,
      painPoints: (painPoints || []).map((pp) => ({
        id: pp.id,
        searchId: pp.search_id,
        title: pp.title,
        sourceTag: pp.subreddit,
        mentionsCount: pp.mentions_count,
        severityScore: pp.severity_score
          ? Number(pp.severity_score)
          : undefined,
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

    // Validate before returning
    return SearchResultSchema.parse(result);
  } catch (error) {
    console.error(
      `[assembleSearchResultFromDB] Failed to assemble result for ${searchId}`,
      error
    );
    return null;
  }
}

/**
 * Check if a search is still processing or has completed/failed
 */
export async function getSearchStatus(
  searchId: string,
  supabase: SupabaseClient
): Promise<{
  status: "pending" | "processing" | "completed" | "failed";
  errorMessage?: string;
} | null> {
  try {
    const { data, error } = await supabase
      .from("searches")
      .select("status, error_message")
      .eq("id", searchId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      status: data.status as "pending" | "processing" | "completed" | "failed",
      errorMessage: data.error_message || undefined,
    };
  } catch (error) {
    console.error(`[getSearchStatus] Failed for ${searchId}`, error);
    return null;
  }
}
