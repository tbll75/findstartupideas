/**
 * Configuration and Environment Variables
 */

// Environment Variables
export const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ??
  Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ??
  "";

export const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export const REDIS_URL = Deno.env.get("UPSTASH_REDIS_REST_URL") ?? "";
export const REDIS_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN") ?? "";

export const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
export const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";

// Validation
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[config] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
  );
}

// Constants

/** Default TTL for cached search results: 2 hours */
export const DEFAULT_RESULT_TTL_SECONDS = 60 * 60 * 2;

/** Maximum number of HN stories to fetch */
export const HN_MAX_STORIES = 60;

/** Number of stories to fetch comments for (reduced for API efficiency) */
export const HN_STORIES_FOR_COMMENTS = 20;

/** Maximum comments per story */
export const HN_MAX_COMMENTS_PER_STORY = 20;

/** Hits per page for Algolia API */
export const HN_HITS_PER_PAGE = 30;

/** Maximum pages to fetch from Algolia */
export const HN_MAX_PAGES = 3;

/** Delay between page fetches (ms) */
export const HN_PAGE_FETCH_DELAY_MS = 200;

/** Delay between comment fetches (ms) */
export const HN_COMMENT_FETCH_DELAY_MS = 120;

/** Maximum stories to send to Gemini for analysis */
export const GEMINI_MAX_STORIES = 40;

/** Maximum comments per story for Gemini */
export const GEMINI_MAX_COMMENTS_PER_STORY = 10;

/** Maximum character length for story snippet */
export const GEMINI_SNIPPET_MAX_LENGTH = 400;

/** Maximum character length for comment snippet */
export const GEMINI_COMMENT_MAX_LENGTH = 280;

/** Gemini cost per 1M tokens (for tracking) */
export const GEMINI_COST_PER_MILLION_TOKENS = 0.075;

/** Maximum pain points to store per search */
export const MAX_PAIN_POINTS = 10;

/** Maximum quotes per pain point */
export const MAX_QUOTES_PER_PAIN_POINT = 5;

/** Maximum quote text length */
export const MAX_QUOTE_TEXT_LENGTH = 800;

/** Edge function timeout (ms) */
export const EDGE_FUNCTION_TIMEOUT_MS = 60_000;
