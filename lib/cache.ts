import {
  SearchResult,
  SearchResultSchema,
  buildSearchKey, // Import from validation.ts instead of duplicating
} from "@/lib/validation";

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

/**
 * Execute a Redis command via Upstash REST API
 * Uses POST with JSON body to avoid URL length limits
 */
async function redisCommand<T = unknown>(
  command: string,
  ...args: (string | number)[]
): Promise<RedisCommandResult<T>> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return { result: null, error: "Redis not configured" };
  }

  try {
    // Use POST with command array to avoid URL length limits
    const res = await fetch(`${REDIS_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([command, ...args]),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[redisCommand] ${command} failed: ${res.status} ${text}`);
      return {
        result: null,
        error: `Redis request failed with ${res.status}: ${text}`,
      };
    }

    const json = (await res.json().catch(() => null)) as { result: T } | null;

    if (!json || typeof json.result === "undefined") {
      console.error(`[redisCommand] ${command} returned malformed response`);
      return { result: null, error: "Malformed Redis response" };
    }

    return { result: json.result };
  } catch (error) {
    console.error(`[redisCommand] ${command} threw error:`, error);
    return {
      result: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function redisGet(key: string): Promise<string | null> {
  const { result, error } = await redisCommand<string>("GET", key);
  if (error) {
    console.error(`[redisGet] Failed for key ${key}:`, error);
  }
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

  const { result, error } = await redisCommand<"OK">("SET", ...args);
  if (error) {
    console.error(`[redisSet] Failed for key ${key}:`, error);
  }
  return result === "OK";
}

export async function redisDel(key: string): Promise<number> {
  const { result, error } = await redisCommand<number>("DEL", key);
  if (error) {
    console.error(`[redisDel] Failed for key ${key}:`, error);
  }
  return typeof result === "number" ? result : 0;
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

/**
 * Clean and validate analysis data before parsing
 */
function cleanAnalysisData(parsed: any): any {
  if (parsed.analysis) {
    // Filter out invalid problem clusters
    if (Array.isArray(parsed.analysis.problemClusters)) {
      parsed.analysis.problemClusters = parsed.analysis.problemClusters.filter(
        (item: unknown) =>
          item &&
          typeof item === "object" &&
          "title" in item &&
          typeof item.title === "string" &&
          item.title.length > 0 &&
          "description" in item &&
          typeof item.description === "string" &&
          item.description.length > 0
      );
    }

    // Filter out invalid product ideas
    if (Array.isArray(parsed.analysis.productIdeas)) {
      parsed.analysis.productIdeas = parsed.analysis.productIdeas.filter(
        (item: unknown) =>
          item &&
          typeof item === "object" &&
          "title" in item &&
          typeof item.title === "string" &&
          item.title.length > 0 &&
          "description" in item &&
          typeof item.description === "string" &&
          item.description.length > 0
      );
    }
  }
  return parsed;
}

export async function getCachedSearchResultById(
  searchId: string
): Promise<SearchResult | null> {
  const key = resultCacheKeyById(searchId);
  const raw = await redisGet(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const cleaned = cleanAnalysisData(parsed);
    const validated = SearchResultSchema.parse(cleaned);
    return validated;
  } catch (error) {
    console.error(
      `[getCachedSearchResultById] Failed to parse cached result for ${searchId}`,
      error
    );
    // Delete corrupted cache entry
    await redisDel(key).catch((err) => {
      console.error(
        `[getCachedSearchResultById] Failed to delete corrupted cache:`,
        err
      );
    });
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
    const cleaned = cleanAnalysisData(parsed);
    const validated = SearchResultSchema.parse(cleaned);
    return validated;
  } catch (error) {
    console.error(
      `[getCachedSearchResultByKey] Failed to parse cached result for key ${searchKey}`,
      error
    );
    // Delete corrupted cache entry
    await redisDel(key).catch((err) => {
      console.error(
        `[getCachedSearchResultByKey] Failed to delete corrupted cache:`,
        err
      );
    });
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

    const ops: Promise<boolean>[] = [];

    ops.push(redisSet(resultCacheKeyById(searchId), serialized, ttlSeconds));

    if (searchKey) {
      ops.push(
        redisSet(resultCacheKeyByKey(searchKey), serialized, ttlSeconds)
      );
    }

    const results = await Promise.allSettled(ops);

    // Log any failures
    results.forEach((r, idx) => {
      if (r.status === "rejected") {
        console.error(
          `[setCachedSearchResult] Failed to cache result (op ${idx}):`,
          r.reason
        );
      }
    });
  } catch (error) {
    console.error(
      "[setCachedSearchResult] Failed to set cached search result",
      error
    );
  }
}

export async function getSearchIdForKey(
  searchKey: string
): Promise<string | null> {
  const key = searchKeyMappingKey(searchKey);
  const raw = await redisGet(key);
  if (!raw) return null;

  try {
    // Try parsing as JSON first (new format from Edge Function)
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : null;
  } catch {
    // Fallback: treat as plain string (old format)
    return typeof raw === "string" && raw.length > 0 ? raw : null;
  }
}

export async function setSearchKeyForId(
  searchKey: string,
  searchId: string,
  ttlSeconds: number = DEFAULT_RESULT_TTL_SECONDS
): Promise<void> {
  try {
    // Store as plain string for simplicity (Edge Function expects this)
    const success = await redisSet(
      searchKeyMappingKey(searchKey),
      searchId,
      ttlSeconds
    );

    if (!success) {
      console.error(
        `[setSearchKeyForId] Failed to set mapping for ${searchKey}`
      );
    }
  } catch (error) {
    console.error("[setSearchKeyForId] Failed to set searchKey mapping", error);
  }
}

// Re-export for backward compatibility
export { redisCommand, buildSearchKey };
