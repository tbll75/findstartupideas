/**
 * Database Result Assemblers
 * Functions to assemble complex results from multiple queries
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  SearchResult,
  HNTag,
  ProblemCluster,
  ProductIdea,
  AiAnalysis,
} from "@/types";
import {
  getSearchById,
  getSearchResults,
  getPainPoints,
  getQuotesForPainPoints,
  getAiAnalysis,
} from "./queries";
import { SearchResultSchema, hnTagsEnum } from "@/lib/schemas";

type DbClient = SupabaseClient<Database>;

function isProblemCluster(value: unknown): value is ProblemCluster {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    typeof v.description === "string" &&
    typeof v.severity === "number" &&
    typeof v.mentionCount === "number" &&
    Array.isArray(v.examples) &&
    v.examples.every((e) => typeof e === "string")
  );
}

function isProductIdea(value: unknown): value is ProductIdea {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    typeof v.description === "string" &&
    typeof v.targetProblem === "string" &&
    typeof v.impactScore === "number"
  );
}

/**
 * Assemble a complete SearchResult from database tables
 * Used as fallback when cache misses or for status polling
 *
 * @param searchId - UUID of the search
 * @param supabase - Supabase client instance
 * @returns Assembled SearchResult or null on error
 */
export async function assembleSearchResultFromDB(
  searchId: string,
  supabase: DbClient
): Promise<SearchResult | null> {
  try {
    // Fetch search row
    const { data: search, error: searchError } = await getSearchById(
      searchId,
      supabase
    );

    if (searchError || !search) {
      console.error(
        `[assembleSearchResultFromDB] Search not found: ${searchId}`,
        searchError
      );
      return null;
    }

    // Fetch search_results
    const { data: searchResults } = await getSearchResults(searchId, supabase);

    // Fetch pain_points
    const { data: painPoints } = await getPainPoints(searchId, supabase);

    // Fetch quotes for all pain points
    const painPointIds = (painPoints || []).map((pp) => pp.id);
    const { data: quotes } = await getQuotesForPainPoints(
      painPointIds,
      supabase
    );

    // Fetch AI analysis
    const { data: analysis } = await getAiAnalysis(searchId, supabase);

    // Validate and filter tags to match HN tags enum
    const validTags = Array.isArray(search.subreddits)
      ? search.subreddits.filter(
          (tag: unknown): tag is HNTag =>
            typeof tag === "string" && hnTagsEnum.safeParse(tag).success
        )
      : [];

    // Build typed AI analysis object (if present)
    const analysisPayload: AiAnalysis | undefined = analysis
      ? {
          summary: analysis.summary,
          problemClusters: Array.isArray(analysis.problem_clusters)
            ? (analysis.problem_clusters as unknown[]).filter(isProblemCluster)
            : [],
          productIdeas: Array.isArray(analysis.product_ideas)
            ? (analysis.product_ideas as unknown[]).filter(isProductIdea)
            : [],
          model: analysis.model ?? undefined,
          tokensUsed: analysis.tokens_used ?? undefined,
        }
      : undefined;

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
      analysis: analysisPayload,
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
 * Get search status from database
 * @param searchId - UUID of the search
 * @param supabase - Supabase client instance
 * @returns Status object or null on error
 */
export async function getSearchStatusFromDB(
  searchId: string,
  supabase: DbClient
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
    console.error(`[getSearchStatusFromDB] Failed for ${searchId}`, error);
    return null;
  }
}
