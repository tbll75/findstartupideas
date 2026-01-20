/**
 * Scrape and Analyze Edge Function
 * Main entry point for HN scraping and AI analysis
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Config
import {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  EDGE_FUNCTION_TIMEOUT_MS,
  HN_MAX_STORIES,
  HN_STORIES_FOR_COMMENTS,
  HN_COMMENT_FETCH_DELAY_MS,
  MAX_PAIN_POINTS,
  MAX_QUOTES_PER_PAIN_POINT,
  MAX_QUOTE_TEXT_LENGTH,
  GEMINI_COST_PER_MILLION_TOKENS,
} from "./config.ts";

// Types
import type {
  HNSearchParams,
  HNComment,
  PainPointRow,
  PainPointQuoteRow,
  SearchResultPayload,
} from "./types.ts";

// Utils
import { withRetry, sleep } from "./utils/retry.ts";
import { stripHtml } from "./utils/html.ts";
import { buildSearchKey } from "./utils/search-key.ts";

// HN
import { fetchHNStories, fetchHNComments } from "./hn/api.ts";
import { pickPrimaryTag, getSortedTags, getSourceTags } from "./hn/utils.ts";

// Gemini
import { callGeminiForAnalysis } from "./gemini/client.ts";

// Database
import {
  updateSearchStatus,
  getSearch,
  getExistingResults,
  insertSearchResults,
  insertPainPoints,
  getPainPoints,
  insertQuotes,
  insertAiAnalysis,
  trackApiUsage,
} from "./db/operations.ts";
import { logJob } from "./db/logging.ts";

// Redis
import { cacheSearchResult } from "./redis/client.ts";

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Extract searchId from request
  const url = new URL(req.url);
  let searchId: string | null = url.searchParams.get("searchId");

  try {
    if (!searchId && req.method !== "GET") {
      const body = await req.json().catch(() => null);
      if (body && typeof body.searchId === "string") {
        searchId = body.searchId;
      }
    }
  } catch {
    // ignore
  }

  if (!searchId) {
    return new Response(JSON.stringify({ error: "Missing searchId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Set up timeout
  const abortController = new AbortController();
  const timeout = setTimeout(
    () => abortController.abort(),
    EDGE_FUNCTION_TIMEOUT_MS
  );

  try {
    console.log(`[${searchId}] Job started`);
    await logJob(supabase, searchId, "info", "scrape_and_analyze job started");

    // Load search parameters
    const { data: search, error: searchError } = await getSearch(
      supabase,
      searchId
    );

    if (searchError || !search) {
      await logJob(supabase, searchId, "error", "Search not found", {
        error: searchError,
      });
      return new Response(JSON.stringify({ error: "Search not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Short-circuit if results already exist
    const existingResults = await getExistingResults(supabase, searchId);
    if (existingResults) {
      console.log(`[${searchId}] Results already exist, skipping`);
      await logJob(
        supabase,
        searchId,
        "info",
        "Existing results found, skipping re-scrape"
      );
      return new Response(JSON.stringify({ status: "already_completed" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    await updateSearchStatus(supabase, searchId, "processing");

    const tags = Array.isArray(search.subreddits) ? search.subreddits : [];

    const hnParams: HNSearchParams = {
      topic: search.topic,
      tags,
      timeRange: (search.time_range as HNSearchParams["timeRange"]) ?? "month",
      sortBy: (search.sort_by as HNSearchParams["sortBy"]) ?? "relevance",
      minUpvotes: search.min_upvotes ?? 0,
    };

    // STEP 1: Fetch HN stories
    console.log(`[${searchId}] Fetching HN stories...`);
    const stories = await withRetry(
      () => fetchHNStories(hnParams, abortController.signal),
      3,
      1000,
      `${searchId}-fetch-stories`
    );

    console.log(`[${searchId}] Found ${stories.length} stories`);
    const limitedStories = stories.slice(0, HN_MAX_STORIES);

    // STEP 2: Fetch comments for top stories
    const comments = new Map<string, HNComment[]>();
    const storiesToFetchComments = limitedStories.slice(
      0,
      HN_STORIES_FOR_COMMENTS
    );
    console.log(
      `[${searchId}] Fetching comments for ${storiesToFetchComments.length} stories`
    );

    for (const story of storiesToFetchComments) {
      const cs = await withRetry(
        () => fetchHNComments(story.id, abortController.signal),
        2,
        500,
        `${searchId}-fetch-comments-${story.id}`
      );
      comments.set(story.id, cs);
      await sleep(HN_COMMENT_FETCH_DELAY_MS);
    }

    // Calculate totals
    const totalPosts = limitedStories.length;
    let totalComments = 0;
    const sourceTags = getSourceTags(limitedStories);

    for (const story of limitedStories) {
      const cs = comments.get(story.id) ?? [];
      totalComments += cs.length;
    }

    console.log(`[${searchId}] Total comments: ${totalComments}`);

    // STEP 3: Call Gemini for analysis
    console.log(`[${searchId}] Calling Gemini...`);
    const analysis = await withRetry(
      () =>
        callGeminiForAnalysis({
          topic: search.topic,
          stories: limitedStories,
          comments,
        }),
      3,
      2000,
      `${searchId}-gemini`
    );

    if (!analysis) {
      throw new Error("Gemini analysis failed after retries");
    }

    console.log(
      `[${searchId}] Gemini returned ${analysis.problemClusters?.length} pain points`
    );

    // Track Gemini usage
    if (analysis.tokensUsed) {
      await trackApiUsage(
        supabase,
        searchId,
        "gemini",
        analysis.tokensUsed,
        GEMINI_COST_PER_MILLION_TOKENS
      );
    }

    // STEP 4: Store search_results metadata
    const totalMentions = totalComments;

    const searchResultsRow = await insertSearchResults(supabase, {
      search_id: searchId,
      total_mentions: totalMentions,
      total_posts_considered: totalPosts,
      total_comments_considered: totalComments,
      source_subreddits: Array.from(sourceTags),
      source_tags: Array.from(sourceTags),
    });

    if (!searchResultsRow) {
      throw new Error("Failed to insert search_results");
    }

    // STEP 5: Store pain points from Gemini analysis
    const painPoints: PainPointRow[] = [];
    const sortedTags = getSortedTags(limitedStories);
    const defaultTag = sortedTags.length > 0 ? sortedTags[0] : "story";

    if (analysis && Array.isArray(analysis.problemClusters)) {
      for (
        let i = 0;
        i < analysis.problemClusters.slice(0, MAX_PAIN_POINTS).length;
        i++
      ) {
        const cluster = analysis.problemClusters[i];
        const assignedTag =
          sortedTags.length > 0
            ? sortedTags[i % sortedTags.length]
            : defaultTag;

        painPoints.push({
          id: crypto.randomUUID(),
          search_id: searchId,
          title: cluster.title || "Untitled pain point",
          subreddit: assignedTag,
          mentions_count: cluster.mentionCount || 1,
          severity_score: cluster.severity || null,
        });
      }
    }

    // Fallback: if no Gemini pain points, create tag-based ones
    if (painPoints.length === 0) {
      console.log(`[${searchId}] No Gemini pain points, using fallback`);
      const mentionsByTag = new Map<string, number>();
      for (const story of limitedStories) {
        const tag = pickPrimaryTag(story);
        mentionsByTag.set(tag, (mentionsByTag.get(tag) ?? 0) + 1);
      }

      for (const [tag, count] of mentionsByTag.entries()) {
        painPoints.push({
          id: crypto.randomUUID(),
          search_id: searchId,
          title: `Discussions in ${tag}`,
          subreddit: tag,
          mentions_count: count,
          severity_score: null,
        });
      }
    }

    if (painPoints.length > 0) {
      await insertPainPoints(supabase, painPoints);
    }

    // Reload persisted pain points
    const persistedPainPoints = await getPainPoints(supabase, searchId);

    // STEP 6: Store quotes from Gemini examples
    const quotes: PainPointQuoteRow[] = [];

    if (analysis && Array.isArray(analysis.problemClusters)) {
      for (let i = 0; i < analysis.problemClusters.length; i++) {
        const cluster = analysis.problemClusters[i];
        const painPoint = persistedPainPoints[i];

        if (!painPoint) continue;

        // Extract quotes from cluster examples
        if (Array.isArray(cluster.examples)) {
          for (const example of cluster.examples.slice(
            0,
            MAX_QUOTES_PER_PAIN_POINT
          )) {
            // Try to find the actual comment that matches this quote
            let foundComment: HNComment | null = null;

            for (const story of limitedStories) {
              const cs = comments.get(story.id) ?? [];
              for (const c of cs) {
                const commentText = stripHtml(c.text ?? "");
                const exampleSnippet =
                  typeof example === "string" ? example.substring(0, 50) : "";

                if (commentText.includes(exampleSnippet)) {
                  foundComment = c;
                  break;
                }
              }
              if (foundComment) break;
            }

            // Only create quote if we found an actual matching comment
            if (foundComment && foundComment.permalink) {
              quotes.push({
                id: crypto.randomUUID(),
                pain_point_id: painPoint.id,
                quote_text: stripHtml(foundComment.text ?? "").slice(
                  0,
                  MAX_QUOTE_TEXT_LENGTH
                ),
                author_handle: foundComment.author ?? null,
                upvotes: foundComment.points ?? 0,
                permalink: foundComment.permalink,
              });
            }
          }
        }
      }
    }

    // Fallback: if no quotes from Gemini, use top comments
    if (quotes.length === 0) {
      console.log(`[${searchId}] No Gemini quotes, using top comments`);
      const allComments: Array<{ comment: HNComment }> = [];

      for (const story of limitedStories) {
        const cs = comments.get(story.id) ?? [];
        for (const c of cs) {
          allComments.push({ comment: c });
        }
      }

      // Sort by upvotes and take top 20
      allComments.sort((a, b) => b.comment.points - a.comment.points);

      // Distribute across pain points
      allComments.slice(0, 20).forEach((item, idx) => {
        const painPoint = persistedPainPoints[idx % persistedPainPoints.length];
        if (!painPoint) return;

        quotes.push({
          id: crypto.randomUUID(),
          pain_point_id: painPoint.id,
          quote_text: stripHtml(item.comment.text ?? "").slice(
            0,
            MAX_QUOTE_TEXT_LENGTH
          ),
          author_handle: item.comment.author,
          upvotes: item.comment.points,
          permalink: item.comment.permalink,
        });
      });
    }

    if (quotes.length > 0) {
      await insertQuotes(supabase, quotes);
    }

    console.log(`[${searchId}] Stored ${quotes.length} quotes`);

    // STEP 7: Store AI analysis
    let analysisRow = null;

    if (analysis && analysis.summary) {
      analysisRow = await insertAiAnalysis(supabase, {
        search_id: searchId,
        summary: analysis.summary,
        problem_clusters: analysis.problemClusters,
        product_ideas: analysis.productIdeas,
        model: analysis.model ?? null,
        tokens_used: analysis.tokensUsed ?? null,
      });
    }

    // STEP 8: Assemble payload and cache in Redis
    const payload: SearchResultPayload = {
      searchId,
      status: "completed",
      topic: search.topic,
      tags,
      timeRange:
        (search.time_range as SearchResultPayload["timeRange"]) ?? "month",
      minUpvotes: search.min_upvotes ?? 0,
      sortBy: (search.sort_by as SearchResultPayload["sortBy"]) ?? "relevance",
      totalMentions: searchResultsRow.total_mentions ?? undefined,
      totalPostsConsidered:
        searchResultsRow.total_posts_considered ?? undefined,
      totalCommentsConsidered:
        searchResultsRow.total_comments_considered ?? undefined,
      sourceTags:
        searchResultsRow.source_tags ??
        searchResultsRow.source_subreddits ??
        undefined,
      painPoints: persistedPainPoints.map((pp) => ({
        id: pp.id,
        searchId: pp.search_id,
        title: pp.title,
        sourceTag: pp.subreddit,
        mentionsCount: pp.mentions_count,
        severityScore: pp.severity_score ?? undefined,
      })),
      quotes: quotes.map((q) => ({
        id: q.id,
        painPointId: q.pain_point_id,
        quoteText: q.quote_text,
        authorHandle: q.author_handle,
        upvotes: q.upvotes,
        permalink: q.permalink,
      })),
      analysis: analysisRow
        ? {
            summary: analysisRow.summary,
            problemClusters: Array.isArray(analysisRow.problem_clusters)
              ? (analysisRow.problem_clusters as unknown[])
              : [],
            productIdeas: Array.isArray(analysisRow.product_ideas)
              ? (analysisRow.product_ideas as unknown[])
              : [],
            model: analysisRow.model ?? undefined,
            tokensUsed: analysisRow.tokens_used ?? undefined,
          }
        : {
            summary: analysis.summary,
            problemClusters: analysis.problemClusters,
            productIdeas: analysis.productIdeas,
            model: analysis.model,
            tokensUsed: analysis.tokensUsed,
          },
    };

    const searchKey = buildSearchKey({
      topic: search.topic,
      tags,
      timeRange:
        (search.time_range as SearchResultPayload["timeRange"]) ?? "month",
      minUpvotes: search.min_upvotes ?? 0,
      sortBy: (search.sort_by as SearchResultPayload["sortBy"]) ?? "relevance",
    });

    console.log(`[${searchId}] Caching results in Redis...`);
    await cacheSearchResult(searchId, searchKey, payload);

    await updateSearchStatus(supabase, searchId, "completed");
    await logJob(
      supabase,
      searchId,
      "info",
      "scrape_and_analyze job completed successfully",
      {
        totalPosts,
        totalComments,
        totalMentions,
        painPoints: painPoints.length,
        quotes: quotes.length,
      }
    );

    console.log(`[${searchId}] Job completed successfully`);
    clearTimeout(timeout);

    return new Response(JSON.stringify({ status: "completed", searchId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${searchId}] Job failed:`, error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    const userFriendlyMessage = errorMessage.includes("ECONNREFUSED")
      ? "Unable to reach external services. Please try again."
      : errorMessage.includes("timeout") || errorMessage.includes("abort")
      ? "Analysis took too long. Try narrowing your search."
      : errorMessage.includes("Gemini")
      ? "AI analysis failed. Please try again."
      : "Something went wrong. Please try again later.";

    await updateSearchStatus(
      supabase,
      searchId!,
      "failed",
      userFriendlyMessage
    );
    await logJob(supabase, searchId!, "error", "scrape_and_analyze job failed", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    clearTimeout(timeout);

    return new Response(
      JSON.stringify({
        status: "failed",
        error: userFriendlyMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
