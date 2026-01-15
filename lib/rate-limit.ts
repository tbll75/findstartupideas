import { redisCommand } from "@/lib/cache";

export type RateLimitContext = {
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
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  totalHits: number;
  resetAt: number; // epoch millis when window resets
};

/**
 * Fixed-window rate limiter using Redis INCR + EXPIRE.
 *
 * Uses SET with NX + EX for atomic first-hit initialization to avoid race conditions.
 *
 * Flow:
 * 1. Try to SET key with value=1, NX (only if not exists), EX (expiry)
 * 2. If SET succeeds, this is first hit → return allowed
 * 3. If SET fails, key exists → INCR it
 * 4. Check if count exceeds limit
 */
export async function applyRateLimit(
  context: RateLimitContext
): Promise<RateLimitResult> {
  const { identifier, maxRequests, windowSeconds, prefix = "rate" } = context;

  const key = `${prefix}:${identifier}`;

  // Try to atomically initialize the key (first request in window)
  const setRes = await redisCommand<"OK" | null>(
    "SET",
    key,
    "1",
    "NX", // Only set if not exists
    "EX",
    windowSeconds
  );

  // If SET succeeded, this is the first request
  if (setRes.result === "OK") {
    return {
      allowed: true,
      remaining: maxRequests - 1,
      totalHits: 1,
      resetAt: Date.now() + windowSeconds * 1000,
    };
  }

  // Key already exists, increment it
  const incrRes = await redisCommand<number>("INCR", key);
  const currentCount =
    typeof incrRes.result === "number" ? incrRes.result : NaN;

  // If Redis is down or returns invalid data
  if (!Number.isFinite(currentCount)) {
    console.error(
      `[applyRateLimit] Redis INCR failed for ${key}:`,
      incrRes.error
    );

    // Fail-closed for security (deny requests when Redis is down)
    // For production, you might want fail-open with conservative limits
    return {
      allowed: false,
      remaining: 0,
      totalHits: maxRequests + 1,
      resetAt: Date.now() + windowSeconds * 1000,
    };
  }

  // Get TTL to calculate resetAt accurately
  const ttlRes = await redisCommand<number>("TTL", key);
  const ttlSeconds =
    typeof ttlRes.result === "number" && ttlRes.result > 0
      ? ttlRes.result
      : windowSeconds;

  const remaining = Math.max(0, maxRequests - currentCount);

  return {
    allowed: currentCount <= maxRequests,
    remaining,
    totalHits: currentCount,
    resetAt: Date.now() + ttlSeconds * 1000,
  };
}

/**
 * Alternative: Sliding Window Rate Limiter using sorted sets
 * More accurate but slightly more expensive
 *
 * Uncomment this if you need true sliding window behavior
 */
/*
export async function applySlidingWindowRateLimit(
  context: RateLimitContext
): Promise<RateLimitResult> {
  const { identifier, maxRequests, windowSeconds, prefix = "rate" } = context;
  const key = `${prefix}:sliding:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Remove old entries outside the window
  await redisCommand("ZREMRANGEBYSCORE", key, "-inf", windowStart);

  // Count current requests in window
  const countRes = await redisCommand<number>("ZCARD", key);
  const currentCount =
    typeof countRes.result === "number" ? countRes.result : 0;

  if (currentCount >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      totalHits: currentCount,
      resetAt: now + windowSeconds * 1000,
    };
  }

  // Add current request
  await redisCommand("ZADD", key, now, `${now}-${Math.random()}`);
  await redisCommand("EXPIRE", key, windowSeconds);

  return {
    allowed: true,
    remaining: maxRequests - currentCount - 1,
    totalHits: currentCount + 1,
    resetAt: now + windowSeconds * 1000,
  };
}
*/

/**
 * Check if rate limit is close to being hit (for warning headers)
 */
export function isApproachingLimit(result: RateLimitResult): boolean {
  return result.remaining <= result.totalHits * 0.2; // Less than 20% remaining
}

/**
 * Format rate limit info for HTTP headers
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
