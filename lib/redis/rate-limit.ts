/**
 * Redis Rate Limiter
 * Fixed-window rate limiting using Redis
 */

import { redisSetNX, redisIncr, redisTTL, redisExpire } from "./client";

/**
 * Rate limit configuration
 */
export interface RateLimitContext {
  /**
   * A stable identifier for the actor being limited.
   * Examples:
   *  - Hashed IP address
   *  - `searchKey:${normalizedTopic}`
   */
  identifier: string;

  /**
   * Max number of allowed actions within the window.
   */
  maxRequests: number;

  /**
   * Window length in seconds.
   */
  windowSeconds: number;

  /**
   * Optional Redis key prefix to distinguish different limit types.
   * e.g. "rate:ip" or "rate:topic"
   */
  prefix?: string;
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;

  /** Number of requests remaining in the window */
  remaining: number;

  /** Total number of requests made in the current window */
  totalHits: number;

  /** Unix timestamp (ms) when the window resets */
  resetAt: number;
}

/**
 * Fixed-window rate limiter using Redis INCR + EXPIRE.
 *
 * Uses SET with NX + EX for atomic first-hit initialization to avoid race conditions.
 *
 * ## Security Note: Fail-Closed Behavior
 *
 * When Redis is unavailable or returns an error, this limiter DENIES requests
 * (fail-closed). This prevents abuse during outages but may impact legitimate
 * users. For high-availability scenarios, consider implementing a fallback
 * mechanism or fail-open with conservative local limits.
 *
 * ## Flow:
 * 1. Try to SET key with value=1, NX (only if not exists), EX (expiry)
 * 2. If SET succeeds, this is first hit → return allowed
 * 3. If SET fails, key exists → INCR it
 * 4. Check if count exceeds limit
 *
 * @param context - Rate limit configuration
 * @returns Rate limit result
 */
export async function applyRateLimit(
  context: RateLimitContext
): Promise<RateLimitResult> {
  const { identifier, maxRequests, windowSeconds, prefix = "rate" } = context;

  const key = `${prefix}:${identifier}`;

  // Try to atomically initialize the key (first request in window)
  const setResult = await redisSetNX(key, "1", windowSeconds);

  // If SET succeeded, this is the first request
  if (setResult) {
    return {
      allowed: true,
      remaining: maxRequests - 1,
      totalHits: 1,
      resetAt: Date.now() + windowSeconds * 1000,
    };
  }

  // Key already exists, increment it (or key was created by INCR with no TTL)
  const currentCount = await redisIncr(key);

  // If key has no TTL (created by INCR on non-existent key when SET NX failed),
  // set expiry to prevent the key from persisting forever
  const ttlSeconds = await redisTTL(key);
  if (ttlSeconds === -1) {
    await redisExpire(key, windowSeconds);
  }

  // If Redis is down or returns invalid data
  if (!Number.isFinite(currentCount)) {
    console.error(`[applyRateLimit] Redis INCR failed for ${key}`);

    // Fail-closed for security (deny requests when Redis is down)
    return {
      allowed: false,
      remaining: 0,
      totalHits: maxRequests + 1,
      resetAt: Date.now() + windowSeconds * 1000,
    };
  }

  // Get TTL to calculate resetAt accurately
  const effectiveTtl = ttlSeconds > 0 ? ttlSeconds : windowSeconds;

  const remaining = Math.max(0, maxRequests - currentCount);

  return {
    allowed: currentCount <= maxRequests,
    remaining,
    totalHits: currentCount,
    resetAt: Date.now() + effectiveTtl * 1000,
  };
}

/**
 * Check if rate limit is close to being hit (for warning headers)
 * @param result - Rate limit result
 * @returns True if less than 20% of requests remaining
 */
export function isApproachingLimit(result: RateLimitResult): boolean {
  return result.remaining <= result.totalHits * 0.2;
}

/**
 * Format rate limit info for HTTP headers
 * @param result - Rate limit result
 * @returns Headers object
 */
export function getRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.totalHits + result.remaining),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
  };
}
