import { SearchResult, SearchResultSchema, SearchRequest } from "@/lib/validation";

/**
 * Low-level Upstash Redis REST client helper.
 *
 * Uses the standard Upstash REST API:
 *   - URL: process.env.UPSTASH_REDIS_REST_URL
 *   - Token: process.env.UPSTASH_REDIS_REST_TOKEN
 *
 * All helpers in this file are safe to use from Next.js
 * Route Handlers (server-only).
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!REDIS_URL || !REDIS_TOKEN) {
  console.warn(
    "[cache] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN env vars. Redis features will be disabled."
  );
}

type RedisCommandResult<T = unknown> = {
  result: T | null;
  error?: string;
};

async function redisCommand<T = unknown>(
  command: string,
  ...args: (string | number)[]
): Promise<RedisCommandResult<T>> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return { result: null, error: "Redis not configured" };
  }

  const path =
    "/" +
    [command, ...args.map((arg) => encodeURIComponent(String(arg)))].join("/");

  const res = await fetch(`${REDIS_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      result: null,
      error: `Redis request failed with ${res.status}: ${text}`,
    };
  }

  const json = (await res.json().catch(() => null)) as
    | { result: T }
    | null;

  if (!json || typeof json.result === "undefined") {
    return { result: null, error: "Malformed Redis response" };
  }

  return { result: json.result };
}

export async function redisGet(key: string): Promise<string | null> {
  const { result } = await redisCommand<string>("get", key);
  return (result as string | null) ?? null;
}

export async function redisSet(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<boolean> {
  const args: (string | number)[] = [key, value];
  if (typeof ttlSeconds === "number" && ttlSeconds > 0) {
    args.push("EX", ttlSeconds);
  }

  const { result } = await redisCommand<"OK">("set", ...args);
  return result === "OK";
}

export async function redisDel(key: string): Promise<number> {
  const { result } = await redisCommand<number>("del", key);
  return typeof result === "number" ? result : 0;
}

/**
 * Compute a stable, deterministic search key from the normalized
 * search request parameters. This key is used both for:
 *  - Redis cache lookup
 *  - DB-level deduplication (if desired)
 */
export function buildSearchKey(input: SearchRequest): string {
  const topic = input.topic.trim().toLowerCase();
  const tags = (input.tags ?? []).map((t) => t.toLowerCase()).sort();

  const payload = {
    topic,
    tags,
    timeRange: input.timeRange,
    minUpvotes: input.minUpvotes,
    sortBy: input.sortBy,
  };

  // Simple deterministic string key; no hashing to avoid Node-only deps.
  return `searchKey:${JSON.stringify(payload)}`;
}

/**
 * High-level cache helpers for search results and searchKey mapping.
 */

const DEFAULT_RESULT_TTL_SECONDS = 60 * 30; // 30 minutes

function resultCacheKeyById(searchId: string): string {
  return `search:result:id:${searchId}`;
}

function resultCacheKeyByKey(searchKey: string): string {
  return `search:result:key:${searchKey}`;
}

function searchKeyMappingKey(searchKey: string): string {
  return `search:map:${searchKey}`;
}

export async function getCachedSearchResultById(
  searchId: string
): Promise<SearchResult | null> {
  const key = resultCacheKeyById(searchId);
  const raw = await redisGet(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const validated = SearchResultSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error("[cache] Failed to parse cached search result by id", error);
    await redisDel(key).catch(() => {});
    return null;
  }
}

export async function getCachedSearchResultByKey(
  searchKey: string
): Promise<SearchResult | null> {
  const key = resultCacheKeyByKey(searchKey);
  const raw = await redisGet(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const validated = SearchResultSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error(
      "[cache] Failed to parse cached search result by searchKey",
      error
    );
    await redisDel(key).catch(() => {});
    return null;
  }
}

export async function setCachedSearchResult(
  searchId: string,
  searchKey: string | null,
  result: SearchResult,
  ttlSeconds: number = DEFAULT_RESULT_TTL_SECONDS
): Promise<void> {
  try {
    const validated = SearchResultSchema.parse(result);
    const serialized = JSON.stringify(validated);

    const ops: Promise<unknown>[] = [];

    ops.push(redisSet(resultCacheKeyById(searchId), serialized, ttlSeconds));

    if (searchKey) {
      ops.push(
        redisSet(resultCacheKeyByKey(searchKey), serialized, ttlSeconds)
      );
    }

    await Promise.allSettled(ops);
  } catch (error) {
    console.error("[cache] Failed to set cached search result", error);
  }
}

export async function getSearchIdForKey(
  searchKey: string
): Promise<string | null> {
  const key = searchKeyMappingKey(searchKey);
  const raw = await redisGet(key);
  return raw ?? null;
}

export async function setSearchKeyForId(
  searchKey: string,
  searchId: string,
  ttlSeconds: number = DEFAULT_RESULT_TTL_SECONDS
): Promise<void> {
  try {
    await redisSet(searchKeyMappingKey(searchKey), searchId, ttlSeconds);
  } catch (error) {
    console.error("[cache] Failed to set searchKey mapping", error);
  }
}

export { redisCommand };

