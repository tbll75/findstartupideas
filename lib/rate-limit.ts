import { redisCommand } from "@/lib/cache";

export type RateLimitContext = {
  /**
   * A stable identifier for the actor being limited.
   * Examples:
   *  - Hashed IP address
   *  - `topic:${normalizedTopic}`
   */
  identifier: string;
  /**
   * Max number of allowed actions within the window.
   */
  maxRequests: number;
  /**
   * Sliding window length in seconds.
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
  resetAt: number; // epoch millis when window resets (best-effort)
};

/**
 * Simple fixed-window rate limiter using Redis INCR + EXPIRE.
 *
 *  - Key: `${prefix}:${identifier}`
 *  - First hit sets EXPIRE=windowSeconds.
 *  - Subsequent hits increment the counter until it exceeds maxRequests.
 */
export async function applyRateLimit(
  context: RateLimitContext
): Promise<RateLimitResult> {
  const { identifier, maxRequests, windowSeconds, prefix = "rate" } = context;

  const key = `${prefix}:${identifier}`;

  // INCR the counter
  const incrRes = await redisCommand<number>("incr", key);
  const currentCount =
    typeof incrRes.result === "number" ? incrRes.result : NaN;

  if (!Number.isFinite(currentCount)) {
    // Redis unavailable or misconfigured → fail open but signal no remaining.
    return {
      allowed: true,
      remaining: maxRequests,
      totalHits: 1,
      resetAt: Date.now() + windowSeconds * 1000,
    };
  }

  // If this is the first hit, set expiry for the window
  if (currentCount === 1) {
    await redisCommand<"OK">("expire", key, windowSeconds);
  }

  const ttlRes = await redisCommand<number>("ttl", key);
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

