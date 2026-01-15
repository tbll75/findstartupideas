import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Types mirroring the public schema -----------------------------

type SearchRow = {
  id: string;
  topic: string;
  subreddits: string[] | null;
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
  subreddit: string;
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

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ??
  Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ??
  "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[scrape_and_analyze] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
  );
}

const REDIS_URL = Deno.env.get("UPSTASH_REDIS_REST_URL") ?? "";
const REDIS_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN") ?? "";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash-lite";

// --- Utility: Retry with exponential backoff ----------------------

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  context = "operation"
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const backoff = delayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[${context}] Attempt ${attempt}/${maxRetries} failed, retrying in ${backoff}ms...`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
  throw new Error("Retry failed");
}

// --- Redis helpers (FIXED) ----------------------------------------

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
  ttlSeconds = 60 * 30
): Promise<void> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    console.warn("[redisSet] Redis not configured, skipping cache");
    return;
  }

  const serializedValue = JSON.stringify(value);

  try {
    // Use Upstash pipeline endpoint for atomic SET + EXPIRE
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["SET", key, serializedValue],
        ["EXPIRE", key, ttlSeconds],
      ]),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[redisSet] Redis failed: ${res.status} ${text}`);
      return;
    }

    const results = await res.json().catch(() => null);
    if (!results || !Array.isArray(results) || results.length !== 2) {
      console.error(`[redisSet] Unexpected Redis response:`, results);
    }
  } catch (err) {
    console.error("[redisSet] Failed to write to Redis", err);
  }
}

// --- Supabase helpers ---------------------------------------------

async function logJob(
  supabase: ReturnType<typeof createClient>,
  searchId: string | null,
  level: "info" | "error",
  message: string,
  context?: Record<string, unknown>
) {
  try {
    await supabase.from("job_logs").insert({
      search_id: searchId,
      level,
      message,
      context: context ?? null,
    });
  } catch (err) {
    console.error("[logJob] Failed to log", err);
  }
}

async function updateSearchStatus(
  supabase: ReturnType<typeof createClient>,
  searchId: string,
  status: "pending" | "processing" | "completed" | "failed",
  errorMessage?: string
) {
  const update: Record<string, unknown> = { status };
  if (status === "completed") {
    update.completed_at = new Date().toISOString();
  }
  if (errorMessage) {
    update.error_message = errorMessage;
  }

  const { error } = await supabase
    .from("searches")
    .update(update)
    .eq("id", searchId);

  if (error) {
    console.error("[updateSearchStatus] Failed to update", error);
  }
}

async function trackApiUsage(
  supabase: ReturnType<typeof createClient>,
  searchId: string,
  service: string,
  tokensUsed: number,
  costPerMillion: number
) {
  try {
    const estimatedCost = (tokensUsed / 1_000_000) * costPerMillion;

    await supabase.from("api_usage").insert({
      search_id: searchId,
      service,
      tokens_used: tokensUsed,
      estimated_cost_usd: estimatedCost,
    });
  } catch (err) {
    console.error("[trackApiUsage] Failed to track usage", err);
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
  timeRange: HNSearchParams["timeRange"]
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
  signal?: AbortSignal
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
    if (!res.ok) {
      console.warn(`[fetchHNSearch] Page ${page} failed: ${res.status}`);
      break;
    }

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
        text:
          typeof hit.story_text === "string"
            ? hit.story_text
            : typeof hit.text === "string"
            ? hit.text
            : null,
        points: typeof hit.points === "number" ? hit.points : 0,
        author: typeof hit.author === "string" ? hit.author : null,
        createdAt:
          typeof hit.created_at_i === "number"
            ? hit.created_at_i * 1000
            : Date.now(),
        tags: Array.isArray(hit._tags) ? hit._tags : [],
        numComments:
          typeof hit.num_comments === "number" ? hit.num_comments : 0,
      });
    }

    // Rate limiting: 200ms between pages
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return stories;
}

async function fetchHNComments(
  storyId: string,
  signal?: AbortSignal
): Promise<HNComment[]> {
  const res = await fetch(
    `https://hn.algolia.com/api/v1/items/${encodeURIComponent(storyId)}`,
    { signal }
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
      createdAt:
        typeof child.created_at_i === "number"
          ? child.created_at_i * 1000
          : Date.now(),
      storyId,
      parentId: child.parent_id ? String(child.parent_id) : null,
      permalink: `https://news.ycombinator.com/item?id=${storyId}#${child.id}`,
    });
  }

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
  return input
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// --- Gemini API helper (FIXED) ------------------------------------

type GeminiAnalysis = {
  summary: string;
  problemClusters: Array<{
    title: string;
    description: string;
    severity: number;
    mentionCount: number;
    examples: string[];
  }>;
  productIdeas: Array<{
    title: string;
    description: string;
    targetProblem: string;
    impactScore: number;
  }>;
  model?: string;
  tokensUsed?: number;
};

async function callGeminiForAnalysis(input: {
  topic: string;
  stories: HNStory[];
  comments: Map<string, HNComment[]>;
}): Promise<GeminiAnalysis | null> {
  if (!GEMINI_API_KEY) {
    console.warn("[callGeminiForAnalysis] GEMINI_API_KEY not configured");
    return null;
  }

  const trimmedItems = input.stories.slice(0, 40).map((story) => {
    const cs = input.comments.get(story.id) ?? [];
    const commentSnippets = cs
      .slice(0, 10)
      .map((c) => stripHtml(c.text ?? "").slice(0, 280));
    return {
      tag: pickPrimaryTag(story),
      title: story.title,
      snippet: stripHtml(story.text ?? "").slice(0, 400),
      upvotes: story.points,
      commentSnippets,
      url: story.url,
    };
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_MODEL
  )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const prompt = `Analyze these Hacker News discussions about "${input.topic}".

Identify the top 3-7 pain point themes and generate product ideas.

Return ONLY valid JSON (no markdown, no backticks) in this EXACT format:

{
  "summary": "2-3 sentence overview of main themes",
  "problemClusters": [
    {
      "title": "Pain point title",
      "description": "1-2 sentence description",
      "severity": 7,
      "mentionCount": 12,
      "examples": ["Quote from user 1", "Quote from user 2"]
    }
  ],
  "productIdeas": [
    {
      "title": "Product idea name",
      "description": "What it does and why it solves the pain",
      "targetProblem": "Which pain point title it addresses",
      "impactScore": 8
    }
  ]
}

Important:
- Identify distinct pain themes, not just categories
- Include real quotes in the examples array (2-5 per cluster)
- Severity is 1-10 (10 = most severe)
- Impact score is 1-10 (10 = highest impact)

Data to analyze:
${JSON.stringify(trimmedItems, null, 2)}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
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
    console.error("[callGeminiForAnalysis] Gemini error", res.status, text);
    return null;
  }

  const json = await res.json();
  const candidates = json?.candidates ?? [];
  const text = candidates[0]?.content?.parts?.[0]?.text ?? "";

  if (!text) {
    console.error("[callGeminiForAnalysis] No text in Gemini response");
    return null;
  }

  let parsed: any;
  try {
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("[callGeminiForAnalysis] Failed to parse Gemini JSON", err);
    console.error("[callGeminiForAnalysis] Raw response:", text);
    return null;
  }

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    problemClusters: Array.isArray(parsed.problemClusters)
      ? parsed.problemClusters
      : [],
    productIdeas: Array.isArray(parsed.productIdeas) ? parsed.productIdeas : [],
    model: GEMINI_MODEL,
    tokensUsed: json?.usageMetadata?.totalTokenCount,
  };
}

// --- Main handler -------------------------------------------------

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

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

  const timeoutMs = 60_000; // 60 seconds
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    console.log(`[${searchId}] Job started`);
    await logJob(supabase, searchId, "info", "scrape_and_analyze job started");

    // Load search parameters
    const { data: search, error: searchError } = await supabase
      .from("searches")
      .select("*")
      .eq("id", searchId)
      .single<SearchRow>();

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
    const { data: existingResults } = await supabase
      .from("search_results")
      .select("*")
      .eq("search_id", searchId)
      .maybeSingle<SearchResultsRow>();

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
      timeRange: (search.time_range as any) ?? "month",
      sortBy: (search.sort_by as any) ?? "relevance",
      minUpvotes: search.min_upvotes ?? 0,
    };

    // STEP 1: Fetch HN stories with retry
    console.log(`[${searchId}] Fetching HN stories...`);
    const stories = await withRetry(
      () => fetchHNSearch(hnParams, abortController.signal),
      3,
      1000,
      `${searchId}-fetch-stories`
    );

    console.log(`[${searchId}] Found ${stories.length} stories`);
    const limitedStories = stories.slice(0, 60);

    // STEP 2: Fetch comments for top stories
    const comments = new Map<string, HNComment[]>();
    const storiesToFetchComments = limitedStories.slice(0, 25);
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
        0.075 // $0.075 per 1M tokens for Gemini 2.0 Flash
      );
    }

    // STEP 4: Store search_results metadata
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

    // STEP 5: Store pain points from Gemini analysis
    const painPoints: PainPointRow[] = [];

    // Calculate tag distribution from stories to assign proper tags to pain points
    const tagCounts = new Map<string, number>();
    for (const story of limitedStories) {
      const tag = pickPrimaryTag(story);
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }

    // Sort tags by frequency (most common first)
    const sortedTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    // Use most common tag as default, or "story" if no tags found
    const defaultTag = sortedTags.length > 0 ? sortedTags[0] : "story";

    if (analysis && Array.isArray(analysis.problemClusters)) {
      for (let i = 0; i < analysis.problemClusters.slice(0, 10).length; i++) {
        const cluster = analysis.problemClusters[i];
        // Distribute tags across pain points based on frequency
        // Use the tag at position i % sortedTags.length, or defaultTag if empty
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
      for (const p of limitedStories) {
        const tag = pickPrimaryTag(p);
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
      const { error: ppError } = await supabase
        .from("pain_points")
        .insert(painPoints);
      if (ppError) {
        throw new Error(`Failed to insert pain_points: ${ppError.message}`);
      }
    }

    // Reload persisted pain points
    const { data: persistedPainPoints } = (await supabase
      .from("pain_points")
      .select("*")
      .eq("search_id", searchId)) as unknown as {
      data: PainPointRow[] | null;
    };

    // STEP 6: Store quotes from Gemini examples
    const quotes: PainPointQuoteRow[] = [];

    if (analysis && Array.isArray(analysis.problemClusters)) {
      for (let i = 0; i < analysis.problemClusters.length; i++) {
        const cluster = analysis.problemClusters[i];
        const painPoint = persistedPainPoints?.[i];

        if (!painPoint) continue;

        // Extract quotes from cluster examples
        if (Array.isArray(cluster.examples)) {
          for (const example of cluster.examples.slice(0, 5)) {
            // Try to find the actual comment that matches this quote
            let foundComment: HNComment | null = null;
            let foundStory: HNStory | null = null;

            for (const story of limitedStories) {
              const cs = comments.get(story.id) ?? [];
              for (const c of cs) {
                const commentText = stripHtml(c.text ?? "");
                const exampleSnippet =
                  typeof example === "string" ? example.substring(0, 50) : "";

                if (commentText.includes(exampleSnippet)) {
                  foundComment = c;
                  foundStory = story;
                  break;
                }
              }
              if (foundComment) break;
            }

            // Only create quote if we found an actual matching comment
            // This ensures the permalink points to a real comment, not just a story
            if (foundComment && foundComment.permalink) {
              quotes.push({
                id: crypto.randomUUID(),
                pain_point_id: painPoint.id,
                quote_text: stripHtml(foundComment.text ?? "").slice(0, 800),
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
      const allComments: Array<{ comment: HNComment; story: HNStory }> = [];

      for (const story of limitedStories) {
        const cs = comments.get(story.id) ?? [];
        for (const c of cs) {
          allComments.push({ comment: c, story });
        }
      }

      // Sort by upvotes and take top 20
      allComments.sort((a, b) => b.comment.points - a.comment.points);

      // Distribute across pain points
      const painPointsArray = persistedPainPoints ?? [];
      allComments.slice(0, 20).forEach((item, idx) => {
        const painPoint = painPointsArray[idx % painPointsArray.length];
        if (!painPoint) return;

        quotes.push({
          id: crypto.randomUUID(),
          pain_point_id: painPoint.id,
          quote_text: stripHtml(item.comment.text ?? "").slice(0, 800),
          author_handle: item.comment.author,
          upvotes: item.comment.points,
          permalink: item.comment.permalink,
        });
      });
    }

    if (quotes.length > 0) {
      const { error: qError } = await supabase
        .from("pain_point_quotes")
        .insert(quotes);
      if (qError) {
        throw new Error(
          `Failed to insert pain_point_quotes: ${qError.message}`
        );
      }
    }

    console.log(`[${searchId}] Stored ${quotes.length} quotes`);

    // STEP 7: Store AI analysis
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
        console.error("[ai_analyses] Insert failed", aiError);
      } else if (Array.isArray(aiRows) && aiRows[0]) {
        analysisRow = aiRows[0] as AiAnalysisRow;
      }
    }

    // STEP 8: Assemble payload and cache in Redis
    const payload: SearchResultPayload = {
      searchId,
      status: "completed",
      topic: search.topic,
      tags,
      timeRange: (search.time_range as any) ?? "month",
      minUpvotes: search.min_upvotes ?? 0,
      sortBy: (search.sort_by as any) ?? "relevance",
      totalMentions: searchResultsRow.total_mentions ?? undefined,
      totalPostsConsidered:
        searchResultsRow.total_posts_considered ?? undefined,
      totalCommentsConsidered:
        searchResultsRow.total_comments_considered ?? undefined,
      sourceTags:
        searchResultsRow.source_tags ??
        searchResultsRow.source_subreddits ??
        undefined,
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
      timeRange: (search.time_range as any) ?? "month",
      minUpvotes: search.min_upvotes ?? 0,
      sortBy: (search.sort_by as any) ?? "relevance",
    });

    console.log(`[${searchId}] Caching results in Redis...`);
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
    await logJob(
      supabase,
      searchId!,
      "error",
      "scrape_and_analyze job failed",
      {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      }
    );

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
