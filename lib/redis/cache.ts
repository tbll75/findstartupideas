/**
 * Redis Cache
 * High-level caching for search results
 */

import { redisGet, redisSet, redisDel } from "./client";
import {
  redisKeyResultById,
  redisKeyResultByKey,
  redisKeySearchMap,
  DEFAULT_RESULT_TTL_SECONDS,
} from "@/shared";
import type { SearchResult, ProblemCluster, ProductIdea } from "@/types";
import { SearchResultSchema } from "@/lib/schemas/search";

/**
 * Clean and validate analysis data before parsing
 * Filters out invalid problem clusters and product ideas
 */
function cleanAnalysisData(
  parsed: Record<string, unknown>
): Record<string, unknown> {
  if (parsed.analysis && typeof parsed.analysis === "object") {
    const analysis = parsed.analysis as Record<string, unknown>;

    // Filter out invalid problem clusters
    if (Array.isArray(analysis.problemClusters)) {
      analysis.problemClusters = analysis.problemClusters.filter(
        (item: unknown): item is ProblemCluster =>
          item !== null &&
          typeof item === "object" &&
          "title" in item &&
          typeof (item as ProblemCluster).title === "string" &&
          (item as ProblemCluster).title.length > 0 &&
          "description" in item &&
          typeof (item as ProblemCluster).description === "string" &&
          (item as ProblemCluster).description.length > 0
      );
    }

    // Filter out invalid product ideas
    if (Array.isArray(analysis.productIdeas)) {
      analysis.productIdeas = analysis.productIdeas.filter(
        (item: unknown): item is ProductIdea =>
          item !== null &&
          typeof item === "object" &&
          "title" in item &&
          typeof (item as ProductIdea).title === "string" &&
          (item as ProductIdea).title.length > 0 &&
          "description" in item &&
          typeof (item as ProductIdea).description === "string" &&
          (item as ProductIdea).description.length > 0
      );
    }
  }
  return parsed;
}

/**
 * Get cached search result by search ID
 * @param searchId - UUID of the search
 * @returns SearchResult or null if not cached/invalid
 */
export async function getCachedSearchResultById(
  searchId: string
): Promise<SearchResult | null> {
  const key = redisKeyResultById(searchId);
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

/**
 * Get cached search result by search key (normalized params)
 * @param searchKey - Normalized search key
 * @returns SearchResult or null if not cached/invalid
 */
export async function getCachedSearchResultByKey(
  searchKey: string
): Promise<SearchResult | null> {
  const key = redisKeyResultByKey(searchKey);
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

/**
 * Cache a search result by both ID and key
 * @param searchId - UUID of the search
 * @param searchKey - Normalized search key (optional)
 * @param result - SearchResult to cache
 * @param ttlSeconds - TTL in seconds (default: 2 hours)
 */
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

    // Cache by ID
    ops.push(redisSet(redisKeyResultById(searchId), serialized, ttlSeconds));

    // Cache by key if provided
    if (searchKey) {
      ops.push(
        redisSet(redisKeyResultByKey(searchKey), serialized, ttlSeconds)
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

/**
 * Get the search ID for a search key
 * @param searchKey - Normalized search key
 * @returns Search ID or null
 */
export async function getSearchIdForKey(
  searchKey: string
): Promise<string | null> {
  const key = redisKeySearchMap(searchKey);
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

/**
 * Map a search key to a search ID
 * @param searchKey - Normalized search key
 * @param searchId - UUID of the search
 * @param ttlSeconds - TTL in seconds (default: 2 hours)
 */
export async function setSearchKeyForId(
  searchKey: string,
  searchId: string,
  ttlSeconds: number = DEFAULT_RESULT_TTL_SECONDS
): Promise<void> {
  try {
    // Store as plain string for simplicity
    const success = await redisSet(
      redisKeySearchMap(searchKey),
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
