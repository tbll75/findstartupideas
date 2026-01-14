// Supabase Edge Function: scrape_and_analyze
//
// Responsibilities (Architecture Plan - Step 4):
// - Accept a search_id
// - Load search parameters from DB
// - Fetch Hacker News stories + comments according to filters
// - Build compact payload and call Gemini for analysis
// - Upsert search_results, pain_points, pain_point_quotes, ai_analyses
// - Assemble SearchResult-shaped payload and write to Redis cache

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Types mirroring the public schema -----------------------------

type SearchRow = {
  id: string;
  topic: string;
  subreddits: string[] | null; // used as HN tags
  time_range: "week" | "month" | "year" | "all" | string;
  min_upvotes: number;
  sort_by: "relevance" | "upvotes" | "recency" | string;
  status: string;
};

type SearchResultsRow = {
  id: string;
  search_id: string;
  total_mentions: number | null;
  total_posts_considered: number | null;
  total_comments_considered: number | null;
  source_subreddits: string[] | null;
  source_tags?: string[] | null;
};

type PainPointRow = {
  id: string;
  search_id: string;
  title: string;
  subreddit: string; // used as HN tag
  mentions_count: number;
  severity_score: number | null;
};

type PainPointQuoteRow = {
  id: string;
  pain_point_id: string;
  quote_text: string;
  author_handle: string | null;
  upvotes: number;
  permalink: string;
};

type AiAnalysisRow = {
  id: string;
  search_id: string;
  summary: string;
  problem_clusters: unknown;
  product_ideas: unknown;
  model: string | null;
  tokens_used: number | null;
};

// Shape roughly aligned with `SearchResult` from `lib/validation.ts`
type SearchResultPayload = {
  searchId: string;
  status: "pending" | "processing" | "completed" | "failed";
  topic: string;
  tags: string[];
  timeRange: "week" | "month" | "year" | "all";
  minUpvotes: number;
  sortBy: "relevance" | "upvotes" | "recency";
  totalMentions?: number;
  totalPostsConsidered?: number;
  totalCommentsConsidered?: number;
  sourceTags?: string[];
  painPoints: {
    id: string;
    searchId: string;
    title: string;
    sourceTag: string;
    mentionsCount: number;
    severityScore?: number;
  }[];
  quotes: {
    id: string;
    painPointId: string;
    quoteText: string;
    authorHandle: string | null;
    upvotes: number;
    permalink: string;
  }[];
  analysis?: {
    summary: string;
    problemClusters: unknown[];
    productIdeas: unknown[];
    model?: string;
    tokensUsed?: number;
  };
};

// --- Environment & helpers ----------------------------------------

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ??
  Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ??
  "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[scrape_and_analyze] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.",
  );
}

const REDIS_URL = Deno.env.get("UPSTASH_REDIS_REST_URL") ?? "";
const REDIS_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN") ?? "";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-1.5-flash";

// Re-implementation of `buildSearchKey` to avoid importing Node code.
function buildSearchKey(input: {
  topic: string;
  tags: string[];
  timeRange: string;
  minUpvotes: number;
  sortBy: string;
}): string {
  const topic = input.topic.trim().toLowerCase();
  const tags = [...(input.tags ?? [])].map((s) => s.toLowerCase()).sort();

  const payload = {
    topic,
    tags,
    timeRange: input.timeRange,
    minUpvotes: input.minUpvotes,
    sortBy: input.sortBy,
  };

  return `searchKey:${JSON.stringify(payload)}`;
}

function redisKeyResultById(searchId: string): string {
  return `search:result:id:${searchId}`;
}

function redisKeyResultByKey(searchKey: string): string {
  return `search:result:key:${searchKey}`;
}

function redisKeySearchMap(searchKey: string): string {
  return `search:map:${searchKey}`;
}

async function redisSet(
  key: string,
  value: unknown,
  ttlSeconds = 60 * 30,
): Promise<void> {
  if (!REDIS_URL || !REDIS_TOKEN) return;
  const body = JSON.stringify({
    key,
    value: JSON.stringify(value),
    ttlSeconds,
  });

  // Using Upstash REST "SET" equivalent via simple GET-style API
  // Here we call the standard /set/{key}/{value}/EX/{ttl} style route.
  const url =
    `${REDIS_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}/EX/${ttlSeconds}`;

  await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
    },
  }).catch((err) =>
    console.error("[scrape_and_analyze] Failed to write Redis", err)
  );
}

async function logJob(
  supabase: ReturnType<typeof createClient>,
  searchId: string | null,
  level: "info" | "error",
  message: string,
  context?: Record<string, unknown>,
) {
  try {
    await supabase.from("job_logs").insert({
      search_id: searchId,
      level,
      message,
      context: context ?? null,
    });
  } catch (err) {
    console.error("[scrape_and_analyze] Failed to log job", err);
  }
}

async function updateSearchStatus(
  supabase: ReturnType<typeof createClient>,
  searchId: string,
  status: "pending" | "processing" | "completed" | "failed",
  errorMessage?: string,
) {
  const update: Record<string, unknown> = { status };
  if (errorMessage) update.error_message = errorMessage;

  const { error } = await supabase.from("searches").update(update)
    .eq("id", searchId);

  if (error) {
    console.error("[scrape_and_analyze] Failed to update search status", error);
  }
}

// --- Hacker News (Algolia) helpers ---------------------------------

type HNSearchParams = {
  topic: string;
  tags: string[];
  timeRange: "week" | "month" | "year" | "all";
  sortBy: "relevance" | "upvotes" | "recency";
  minUpvotes: number;
};

type HNStory = {
  id: string;
  title: string;
  url: string | null;
  text: string | null;
  points: number;
  author: string | null;
  createdAt: number;
  tags: string[];
  numComments: number;
};

type HNComment = {
  id: string;
  text: string | null;
  points: number;
  author: string | null;
  createdAt: number;
  storyId: string;
  parentId: string | null;
  permalink: string;
};

function mapTimeRangeToTimestamp(
  timeRange: HNSearchParams["timeRange"],
): number | null {
  const now = Math.floor(Date.now() / 1000);
  if (timeRange === "week") return now - 60 * 60 * 24 * 7;
  if (timeRange === "month") return now - 60 * 60 * 24 * 30;
  if (timeRange === "year") return now - 60 * 60 * 24 * 365;
  return null;
}

function buildNumericFilters(params: HNSearchParams): string {
  const filters: string[] = [];
  if (params.minUpvotes > 0) {
    filters.push(`points>=${params.minUpvotes}`);
  }
  const ts = mapTimeRangeToTimestamp(params.timeRange);
  if (ts) {
    filters.push(`created_at_i>=${ts}`);
  }
  return filters.join(",");
}

function mapSortEndpoint(sortBy: HNSearchParams["sortBy"]): string {
  return sortBy === "recency" ? "search_by_date" : "search";
}

function mapTags(tags: string[]): string | undefined {
  if (!tags || tags.length === 0) return undefined;
  if (tags.length === 1) return tags[0];
  return `(${tags.join(",")})`;
}

async function fetchHNSearch(
  params: HNSearchParams,
  signal?: AbortSignal,
): Promise<HNStory[]> {
  const endpoint = mapSortEndpoint(params.sortBy);
  const hitsPerPage = 30;
  const maxPages = 3;
  const stories: HNStory[] = [];

  for (let page = 0; page < maxPages; page++) {
    const url = new URL(`https://hn.algolia.com/api/v1/${endpoint}`);
    url.searchParams.set("query", params.topic);
    url.searchParams.set("page", String(page));
    url.searchParams.set("hitsPerPage", String(hitsPerPage));
    const tags = mapTags(params.tags);
    if (tags) url.searchParams.set("tags", tags);
    const numericFilters = buildNumericFilters(params);
    if (numericFilters) url.searchParams.set("numericFilters", numericFilters);

    const res = await fetch(url.toString(), { signal });
    if (!res.ok) break;
    const json = await res.json();
    const hits = json?.hits ?? [];
    if (!Array.isArray(hits) || hits.length === 0) break;

    for (const hit of hits) {
      const id = hit.objectID ?? hit.objectId ?? hit.id;
      if (!id) continue;
      stories.push({
        id: String(id),
        title: hit.title ?? hit.story_title ?? "",
        url: hit.url ?? hit.story_url ?? null,
        text: typeof hit.story_text === "string"
          ? hit.story_text
          : typeof hit.text === "string"
          ? hit.text
          : null,
        points: typeof hit.points === "number" ? hit.points : 0,
        author: typeof hit.author === "string" ? hit.author : null,
        createdAt: typeof hit.created_at_i === "number"
          ? hit.created_at_i * 1000
          : Date.now(),
        tags: Array.isArray(hit._tags) ? hit._tags : [],
        numComments: typeof hit.num_comments === "number" ? hit.num_comments : 0,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return stories;
}

async function fetchHNComments(
  storyId: string,
  signal?: AbortSignal,
): Promise<HNComment[]> {
  const res = await fetch(
    `https://hn.algolia.com/api/v1/items/${encodeURIComponent(storyId)}`,
    { signal },
  );
  if (!res.ok) return [];

  const json = await res.json();
  const children: any[] = json?.children ?? [];

  const comments: HNComment[] = [];
  for (const child of children) {
    if (!child || typeof child.id === "undefined") continue;
    if (!child.text || typeof child.text !== "string") continue;
    comments.push({
      id: String(child.id),
      text: child.text,
      points: typeof child.points === "number" ? child.points : 0,
      author: typeof child.author === "string" ? child.author : null,
      createdAt: typeof child.created_at_i === "number"
        ? child.created_at_i * 1000
        : Date.now(),
      storyId,
      parentId: child.parent_id ? String(child.parent_id) : null,
      permalink: `https://news.ycombinator.com/item?id=${storyId}#${child.id}`,
    });
  }

  // Sort comments by points descending and take top slice
  comments.sort((a, b) => b.points - a.points);
  return comments.slice(0, 20);
}

function pickPrimaryTag(story: HNStory): string {
  const preferred = ["ask_hn", "show_hn", "front_page", "poll", "story"];
  for (const t of preferred) {
    if (story.tags?.includes(t)) return t;
  }
  return "story";
}

function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// --- Gemini API helper --------------------------------------------

type GeminiAnalysis = {
  summary: string;
  problemClusters: unknown[];
  productIdeas: unknown[];
  model?: string;
  tokensUsed?: number;
};

async function callGeminiForAnalysis(input: {
  topic: string;
  stories: HNStory[];
  comments: Map<string, HNComment[]>;
}): Promise<GeminiAnalysis | null> {
  if (!GEMINI_API_KEY) {
    console.warn("[scrape_and_analyze] GEMINI_API_KEY not configured");
    return null;
  }

  const trimmedItems = input.stories.slice(0, 40).map((story) => {
    const cs = input.comments.get(story.id) ?? [];
    const commentSnippets = cs.slice(0, 10).map((c) =>
      stripHtml(c.text ?? "").slice(0, 280)
    );
    return {
      tag: pickPrimaryTag(story),
      title: story.title,
      snippet: stripHtml(story.text ?? "").slice(0, 400),
      upvotes: story.points,
      commentSnippets,
      url: story.url,
    };
  });

  const systemPrompt =
    "You are analyzing Hacker News discussions about a product/topic. Summarize key pain themes and propose product ideas. Respond in strict JSON.";

  const userPrompt =
    `Topic: ${input.topic}\n\nPlease identify top pain themes and product ideas based on these Hacker News stories and comments.`;

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: systemPrompt },
          {
            text:
              "Return JSON with shape: {\"summary\": string, \"problemClusters\": Array<any>, \"productIdeas\": Array<any>}. Do not include markdown.",
          },
          { text: userPrompt },
          { text: JSON.stringify(trimmedItems) },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[scrape_and_analyze] Gemini error", res.status, text);
    return null;
  }

  const json = await res.json();
  const candidates = json?.candidates ?? [];
  const text = candidates[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) return null;

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    console.error("[scrape_and_analyze] Failed to parse Gemini JSON", err);
    return null;
  }

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    problemClusters: Array.isArray(parsed.problemClusters)
      ? parsed.problemClusters
      : [],
    productIdeas: Array.isArray(parsed.productIdeas)
      ? parsed.productIdeas
      : [],
    model: GEMINI_MODEL,
    tokensUsed: undefined,
  };
}

// --- Main handler -------------------------------------------------

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const url = new URL(req.url);

  // Accept searchId from JSON body or query param
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
    return new Response(
      JSON.stringify({ error: "Missing searchId" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const timeoutMs = 35_000;
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    await logJob(
      supabase,
      searchId,
      "info",
      "scrape_and_analyze job started",
    );

    const { data: search, error: searchError } = await supabase
      .from("searches")
      .select("*")
      .eq("id", searchId)
      .single<SearchRow>();

    if (searchError || !search) {
      await logJob(
        supabase,
        searchId,
        "error",
        "Search not found",
        { error: searchError },
      );
      return new Response(
        JSON.stringify({ error: "Search not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Short-circuit if we already have results
    const { data: existingResults } = await supabase
      .from("search_results")
      .select("*")
      .eq("search_id", searchId)
      .maybeSingle<SearchResultsRow>();

    if (existingResults) {
      await logJob(
        supabase,
        searchId,
        "info",
        "Existing search_results found; skipping re-scrape",
      );
      return new Response(
        JSON.stringify({ status: "already_completed" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    await updateSearchStatus(supabase, searchId, "processing");

    const tags = Array.isArray(search.subreddits) ? search.subreddits : [];

    const hnParams: HNSearchParams = {
      topic: search.topic,
      tags,
      timeRange: (search.time_range as any) ?? "month",
      sortBy: (search.sort_by as any) ?? "relevance",
      minUpvotes: search.min_upvotes ?? 0,
    };

    const stories = await fetchHNSearch(hnParams, abortController.signal);
    const limitedStories = stories.slice(0, 60);

    const comments = new Map<string, HNComment[]>();
    for (const story of limitedStories.slice(0, 25)) {
      const cs = await fetchHNComments(story.id, abortController.signal);
      comments.set(story.id, cs);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    const totalPosts = limitedStories.length;
    let totalComments = 0;
    const sourceTags = new Set<string>();

    for (const p of limitedStories) {
      (p.tags ?? []).forEach((t) => sourceTags.add(t));
      const cs = comments.get(p.id) ?? [];
      totalComments += cs.length;
    }

    const totalMentions = totalComments;

    const { data: searchResultsRow, error: srError } = await supabase
      .from("search_results")
      .insert({
        search_id: searchId,
        total_mentions: totalMentions,
        total_posts_considered: totalPosts,
        total_comments_considered: totalComments,
        source_subreddits: Array.from(sourceTags),
        source_tags: Array.from(sourceTags),
      })
      .select("*")
      .single<SearchResultsRow>();

    if (srError || !searchResultsRow) {
      throw new Error("Failed to insert search_results");
    }

    // Simple heuristic: one pain point per primary tag aggregating mentions.
    const mentionsByTag = new Map<string, number>();
    for (const p of limitedStories) {
      const tag = pickPrimaryTag(p);
      mentionsByTag.set(tag, (mentionsByTag.get(tag) ?? 0) + 1);
    }

    const painPoints: PainPointRow[] = [];
    for (const [tag, count] of mentionsByTag.entries()) {
      const id = crypto.randomUUID();
      painPoints.push({
        id,
        search_id: searchId,
        title: `Recurring discussions in ${tag}`,
        subreddit: tag,
        mentions_count: count,
        severity_score: null,
      });
    }

    if (painPoints.length > 0) {
      const { error: ppError } = await supabase
        .from("pain_points")
        .insert(painPoints);
      if (ppError) {
        throw new Error(`Failed to insert pain_points: ${ppError.message}`);
      }
    }

    // Map tag -> pain_point_id for quotes
    const { data: persistedPainPoints } = await supabase
      .from("pain_points")
      .select("*")
      .eq("search_id", searchId) as unknown as {
        data: PainPointRow[] | null;
      };

    const painPointByTag = new Map<string, string>();
    (persistedPainPoints ?? []).forEach((pp) => {
      painPointByTag.set(pp.subreddit, pp.id);
    });

    const quotes: PainPointQuoteRow[] = [];
    for (const story of limitedStories) {
      const painPointId = painPointByTag.get(pickPrimaryTag(story));
      if (!painPointId) continue;

      const cs = comments.get(story.id) ?? [];
      for (const c of cs.slice(0, 5)) {
        quotes.push({
          id: crypto.randomUUID(),
          pain_point_id: painPointId,
          quote_text: stripHtml(c.text ?? "").slice(0, 800),
          author_handle: c.author,
          upvotes: c.points,
          permalink: c.permalink,
        });
      }
    }

    if (quotes.length > 0) {
      const { error: qError } = await supabase
        .from("pain_point_quotes")
        .insert(quotes);
      if (qError) {
        throw new Error(
          `Failed to insert pain_point_quotes: ${qError.message}`,
        );
      }
    }

    const analysis = await callGeminiForAnalysis({
      topic: search.topic,
      stories: limitedStories,
      comments,
    });

    let analysisRow: AiAnalysisRow | null = null;
    if (analysis && analysis.summary) {
      const { data: aiRows, error: aiError } = await supabase
        .from("ai_analyses")
        .insert({
          search_id: searchId,
          summary: analysis.summary,
          problem_clusters: analysis.problemClusters,
          product_ideas: analysis.productIdeas,
          model: analysis.model,
          tokens_used: analysis.tokensUsed ?? null,
        })
        .select("*");

      if (aiError) {
        console.error("[scrape_and_analyze] Failed to insert ai_analyses", aiError);
      } else if (Array.isArray(aiRows) && aiRows[0]) {
        analysisRow = aiRows[0] as AiAnalysisRow;
      }
    }

    // Assemble SearchResult-like payload for Redis cache
    const payload: SearchResultPayload = {
      searchId,
      status: "completed",
      topic: search.topic,
      tags,
      timeRange: (search.time_range as any) ?? "month",
      minUpvotes: search.min_upvotes ?? 0,
      sortBy: (search.sort_by as any) ?? "relevance",
      totalMentions: searchResultsRow.total_mentions ?? undefined,
      totalPostsConsidered: searchResultsRow.total_posts_considered ??
        undefined,
      totalCommentsConsidered: searchResultsRow.total_comments_considered ??
        undefined,
      sourceTags: searchResultsRow.source_tags ??
        searchResultsRow.source_subreddits ?? undefined,
      painPoints: (persistedPainPoints ?? []).map((pp) => ({
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
            ? analysisRow.problem_clusters as unknown[]
            : [],
          productIdeas: Array.isArray(analysisRow.product_ideas)
            ? analysisRow.product_ideas as unknown[]
            : [],
          model: analysisRow.model ?? undefined,
          tokensUsed: analysisRow.tokens_used ?? undefined,
        }
        : analysis
        ? {
          summary: analysis.summary,
          problemClusters: analysis.problemClusters,
          productIdeas: analysis.productIdeas,
          model: analysis.model,
          tokensUsed: analysis.tokensUsed,
        }
        : undefined,
    };

    const searchKey = buildSearchKey({
      topic: search.topic,
      tags,
      timeRange: (search.time_range as any) ?? "month",
      minUpvotes: search.min_upvotes ?? 0,
      sortBy: (search.sort_by as any) ?? "relevance",
    });

    await Promise.all([
      redisSet(redisKeyResultById(searchId), payload),
      redisSet(redisKeyResultByKey(searchKey), payload),
      redisSet(redisKeySearchMap(searchKey), searchId),
    ]);

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
      },
    );

    clearTimeout(timeout);
    return new Response(
      JSON.stringify({ status: "completed", searchId }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[scrape_and_analyze] Job failed", error);
    await updateSearchStatus(
      supabase,
      searchId!,
      "failed",
      "Failed to complete analysis. Please try again later.",
    );
    await logJob(
      supabase,
      searchId!,
      "error",
      "scrape_and_analyze job failed",
      { error: String(error) },
    );
    clearTimeout(timeout);
    return new Response(
      JSON.stringify({
        status: "failed",
        error: "Internal error while processing search.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

