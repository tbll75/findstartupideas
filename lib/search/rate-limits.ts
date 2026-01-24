/**
 * Search Rate Limiting
 * Rate limiting specific to search endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, getRateLimitHeaders } from "@/lib/redis";
import { getClientIp } from "@/lib/api/request-utils";
import { rateLimitErrorResponse } from "@/lib/api/errors";
import { buildSearchKey, type SearchKeyInput } from "@/shared/search-key";
import {
  RATE_LIMIT_GLOBAL_MAX_REQUESTS,
  RATE_LIMIT_GLOBAL_WINDOW_SECONDS,
  RATE_LIMIT_IP_MAX_REQUESTS,
  RATE_LIMIT_IP_WINDOW_SECONDS,
  RATE_LIMIT_IP_DAILY_MAX_REQUESTS,
  RATE_LIMIT_IP_DAILY_WINDOW_SECONDS,
  RATE_LIMIT_TOPIC_MAX_REQUESTS,
  RATE_LIMIT_TOPIC_WINDOW_SECONDS,
} from "@/shared/constants";
import {
  RATE_LIMIT_GLOBAL_PREFIX,
  RATE_LIMIT_IP_PREFIX,
  RATE_LIMIT_IP_DAILY_PREFIX,
  RATE_LIMIT_TOPIC_PREFIX,
} from "@/shared/redis-keys";

/**
 * Result of rate limit enforcement
 */
export interface RateLimitEnforcementResult {
  /** Error response if rate limit exceeded, null if allowed */
  error: NextResponse | null;
  /** Headers to include in response */
  headers: Record<string, string>;
}

/**
 * Enforce rate limits for search requests
 * Applies both IP-based and topic-based rate limiting
 *
 * @param req - Next.js request object
 * @param input - Search request parameters
 * @returns Rate limit result with error response or headers
 */
export async function enforceSearchRateLimits(
  req: NextRequest,
  input: SearchKeyInput
): Promise<RateLimitEnforcementResult> {
  // Global rate limit - protects against viral traffic spikes
  const globalLimit = await applyRateLimit({
    identifier: "all",
    maxRequests: RATE_LIMIT_GLOBAL_MAX_REQUESTS,
    windowSeconds: RATE_LIMIT_GLOBAL_WINDOW_SECONDS,
    prefix: RATE_LIMIT_GLOBAL_PREFIX,
  });

  if (!globalLimit.allowed) {
    const retryAfter = Math.max(
      1,
      Math.round((globalLimit.resetAt - Date.now()) / 1000)
    );

    return {
      error: rateLimitErrorResponse(
        "Service is experiencing high demand. Please try again shortly.",
        { "X-RateLimit-Global-Remaining": "0" },
        retryAfter
      ),
      headers: {},
    };
  }

  const ip = getClientIp(req);

  // Per-IP limit
  const ipLimit = await applyRateLimit({
    identifier: ip,
    maxRequests: RATE_LIMIT_IP_MAX_REQUESTS,
    windowSeconds: RATE_LIMIT_IP_WINDOW_SECONDS,
    prefix: RATE_LIMIT_IP_PREFIX,
  });

  const ipHeaders = getRateLimitHeaders(ipLimit);

  if (!ipLimit.allowed) {
    const retryAfter = Math.max(
      1,
      Math.round((ipLimit.resetAt - Date.now()) / 1000)
    );

    return {
      error: rateLimitErrorResponse(
        "Too many requests from this IP. Please slow down.",
        ipHeaders,
        retryAfter
      ),
      headers: ipHeaders,
    };
  }

  // Per-IP daily limit
  const ipDailyLimit = await applyRateLimit({
    identifier: ip,
    maxRequests: RATE_LIMIT_IP_DAILY_MAX_REQUESTS,
    windowSeconds: RATE_LIMIT_IP_DAILY_WINDOW_SECONDS,
    prefix: RATE_LIMIT_IP_DAILY_PREFIX,
  });

  if (!ipDailyLimit.allowed) {
    const retryAfter = Math.max(
      1,
      Math.ceil((ipDailyLimit.resetAt - Date.now()) / 1000)
    );

    return {
      error: rateLimitErrorResponse(
        "Daily search limit reached. Please try again tomorrow.",
        {
          ...ipHeaders,
          "X-RateLimit-Daily-Remaining": "0",
        },
        retryAfter
      ),
      headers: ipHeaders,
    };
  }

  // Per-topic limit
  const searchKey = buildSearchKey(input);
  const topicLimit = await applyRateLimit({
    identifier: searchKey,
    maxRequests: RATE_LIMIT_TOPIC_MAX_REQUESTS,
    windowSeconds: RATE_LIMIT_TOPIC_WINDOW_SECONDS,
    prefix: RATE_LIMIT_TOPIC_PREFIX,
  });

  if (!topicLimit.allowed) {
    const retryAfter = Math.max(
      1,
      Math.round((topicLimit.resetAt - Date.now()) / 1000)
    );

    return {
      error: rateLimitErrorResponse(
        "This topic is being searched too frequently. Please wait a moment.",
        {
          ...ipHeaders,
          "X-RateLimit-Remaining-Topic": String(topicLimit.remaining),
        },
        retryAfter
      ),
      headers: ipHeaders,
    };
  }

  return { error: null, headers: ipHeaders };
}
