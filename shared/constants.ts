/**
 * Shared Constants
 * Used by both Next.js app and Supabase Edge Functions
 */

// ============================================================================
// Cache TTLs (in seconds)
// ============================================================================

/** Default TTL for cached search results: 2 hours */
export const DEFAULT_RESULT_TTL_SECONDS = 60 * 60 * 2;

/** TTL for search key to ID mappings: 2 hours */
export const SEARCH_KEY_MAPPING_TTL_SECONDS = 60 * 60 * 2;

// ============================================================================
// Rate Limiting
// ============================================================================

/** Per-IP rate limit: max requests in window */
export const RATE_LIMIT_IP_MAX_REQUESTS = 20;

/** Per-IP rate limit: window duration in seconds (10 minutes) */
export const RATE_LIMIT_IP_WINDOW_SECONDS = 60 * 10;

/** Per-topic rate limit: max requests in window */
export const RATE_LIMIT_TOPIC_MAX_REQUESTS = 10;

/** Per-topic rate limit: window duration in seconds (1 minute) */
export const RATE_LIMIT_TOPIC_WINDOW_SECONDS = 60;

// ============================================================================
// HN Scraping Limits
// ============================================================================

/** Maximum number of HN stories to fetch */
export const HN_MAX_STORIES = 60;

/** Number of stories to fetch comments for */
export const HN_STORIES_FOR_COMMENTS = 25;

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

// ============================================================================
// Gemini API
// ============================================================================

/** Default Gemini model */
export const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";

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

// ============================================================================
// Polling
// ============================================================================

/** Short-poll duration for initial search (ms) */
export const SHORT_POLL_MAX_WAIT_MS = 8000;

/** Short-poll interval (ms) */
export const SHORT_POLL_INTERVAL_MS = 500;

/** Client-side polling interval (ms) */
export const CLIENT_POLL_INTERVAL_MS = 2500;

/** Client-side max poll attempts */
export const CLIENT_MAX_POLL_ATTEMPTS = 30;

// ============================================================================
// Edge Function
// ============================================================================

/** Edge function timeout (ms) */
export const EDGE_FUNCTION_TIMEOUT_MS = 60_000;

/** Edge function trigger timeout (ms) */
export const EDGE_FUNCTION_TRIGGER_TIMEOUT_MS = 2000;

// ============================================================================
// Validation
// ============================================================================

/** Minimum topic length */
export const TOPIC_MIN_LENGTH = 2;

/** Maximum topic length */
export const TOPIC_MAX_LENGTH = 100;

/** Maximum tags allowed */
export const MAX_TAGS = 10;

/** Maximum upvotes filter value */
export const MAX_UPVOTES_FILTER = 10000;

// ============================================================================
// Database
// ============================================================================

/** Maximum pain points to store per search */
export const MAX_PAIN_POINTS = 10;

/** Maximum quotes per pain point */
export const MAX_QUOTES_PER_PAIN_POINT = 5;

/** Maximum quote text length */
export const MAX_QUOTE_TEXT_LENGTH = 800;
