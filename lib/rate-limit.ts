/**
 * Rate Limit Module (Backward Compatibility)
 *
 * This file re-exports from the new modular Redis structure.
 * New code should import directly from @/lib/redis.
 *
 * @deprecated Import from @/lib/redis instead
 */

export {
  applyRateLimit,
  isApproachingLimit,
  getRateLimitHeaders,
  type RateLimitContext,
  type RateLimitResult,
} from "./redis/rate-limit";
