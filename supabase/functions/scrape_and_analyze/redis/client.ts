/**
 * Redis Client for Edge Function
 * Uses Upstash REST API
 */

import { REDIS_URL, REDIS_TOKEN, DEFAULT_RESULT_TTL_SECONDS } from "../config.ts";

/**
 * Check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return Boolean(REDIS_URL && REDIS_TOKEN);
}

/**
 * Redis key builders
 */
export function redisKeyResultById(searchId: string): string {
  return `search:result:id:${searchId}`;
}

export function redisKeyResultByKey(searchKey: string): string {
  return `search:result:key:${searchKey}`;
}

export function redisKeySearchMap(searchKey: string): string {
  return `search:map:${searchKey}`;
}

/**
 * Set a value in Redis with TTL
 */
export async function redisSet(
  key: string,
  value: unknown,
  ttlSeconds = DEFAULT_RESULT_TTL_SECONDS
): Promise<void> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    console.warn("[redisSet] Redis not configured, skipping cache");
    return;
  }

  const serializedValue = JSON.stringify(value);

  try {
    // Use Upstash pipeline endpoint for atomic SET + EXPIRE
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["SET", key, serializedValue],
        ["EXPIRE", key, ttlSeconds],
      ]),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[redisSet] Redis failed: ${res.status} ${text}`);
      return;
    }

    const results = await res.json().catch(() => null);
    if (!results || !Array.isArray(results) || results.length !== 2) {
      console.error(`[redisSet] Unexpected Redis response:`, results);
    }
  } catch (err) {
    console.error("[redisSet] Failed to write to Redis", err);
  }
}

/**
 * Cache search result in Redis by both ID and key
 */
export async function cacheSearchResult(
  searchId: string,
  searchKey: string,
  payload: unknown
): Promise<void> {
  await Promise.all([
    redisSet(redisKeyResultById(searchId), payload),
    redisSet(redisKeyResultByKey(searchKey), payload),
    redisSet(redisKeySearchMap(searchKey), searchId),
  ]);
}
