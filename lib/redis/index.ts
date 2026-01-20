/**
 * Redis Module Exports
 */

// Client
export {
  isRedisConfigured,
  redisCommand,
  redisGet,
  redisSet,
  redisSetNX,
  redisDel,
  redisIncr,
  redisTTL,
  type RedisCommandResult,
} from "./client";

// Cache
export {
  getCachedSearchResultById,
  getCachedSearchResultByKey,
  setCachedSearchResult,
  getSearchIdForKey,
  setSearchKeyForId,
} from "./cache";

// Rate Limiting
export {
  applyRateLimit,
  isApproachingLimit,
  getRateLimitHeaders,
  type RateLimitContext,
  type RateLimitResult,
} from "./rate-limit";
