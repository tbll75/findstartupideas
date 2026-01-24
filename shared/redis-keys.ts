/**
 * Redis Key Builders
 * Consistent key generation for Redis operations
 * Used by both Next.js app and Edge Functions
 */

/**
 * Key for caching search results by search ID
 * @param searchId - UUID of the search
 */
export function redisKeyResultById(searchId: string): string {
  return `search:result:id:${searchId}`;
}

/**
 * Key for caching search results by search key (normalized params)
 * @param searchKey - Normalized search key from buildSearchKey()
 */
export function redisKeyResultByKey(searchKey: string): string {
  return `search:result:key:${searchKey}`;
}

/**
 * Key for mapping search key to search ID
 * @param searchKey - Normalized search key from buildSearchKey()
 */
export function redisKeySearchMap(searchKey: string): string {
  return `search:map:${searchKey}`;
}

/**
 * Key prefix for global rate limiting (all users combined)
 */
export const RATE_LIMIT_GLOBAL_PREFIX = "rate:global";

/**
 * Key prefix for IP-based rate limiting (per minute)
 */
export const RATE_LIMIT_IP_PREFIX = "rate:ip";

/**
 * Key prefix for IP-based daily rate limiting
 */
export const RATE_LIMIT_IP_DAILY_PREFIX = "rate:ip:daily";

/**
 * Key prefix for topic-based rate limiting
 */
export const RATE_LIMIT_TOPIC_PREFIX = "rate:topic";

/**
 * Build rate limit key for an identifier
 * @param prefix - Key prefix (e.g., "rate:ip" or "rate:topic")
 * @param identifier - The identifier being rate limited
 */
export function buildRateLimitKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}
