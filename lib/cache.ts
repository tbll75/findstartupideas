/**
 * Cache Module (Backward Compatibility)
 *
 * This file re-exports from the new modular Redis structure.
 * New code should import directly from @/lib/redis.
 *
 * @deprecated Import from @/lib/redis instead
 */

// Re-export Redis client functions
export {
  redisCommand,
  redisGet,
  redisSet,
  redisDel,
} from "./redis/client";

// Re-export cache functions
export {
  getCachedSearchResultById,
  getCachedSearchResultByKey,
  setCachedSearchResult,
  getSearchIdForKey,
  setSearchKeyForId,
} from "./redis/cache";

// Re-export buildSearchKey for backward compatibility
export { buildSearchKey } from "@/shared/search-key";
