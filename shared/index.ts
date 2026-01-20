/**
 * Shared Module Exports
 * Code shared between Next.js app and Supabase Edge Functions
 */

// Constants
export * from "./constants";

// Search key builder
export { buildSearchKey, type SearchKeyInput } from "./search-key";

// Redis key builders
export {
  redisKeyResultById,
  redisKeyResultByKey,
  redisKeySearchMap,
  buildRateLimitKey,
  RATE_LIMIT_IP_PREFIX,
  RATE_LIMIT_TOPIC_PREFIX,
} from "./redis-keys";

// HTML utilities
export { stripHtml, truncateText, escapeHtml } from "./html-utils";
