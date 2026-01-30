/**
 * Hacker News API Client
 * Fetches stories and comments from Algolia HN API
 */

import type { HNSearchParams, HNStory, HNComment } from "../types.ts";
import {
  HN_HITS_PER_PAGE,
  HN_MAX_PAGES,
  HN_PAGE_FETCH_DELAY_MS,
  HN_MAX_COMMENTS_PER_STORY,
} from "../config.ts";
import { sleep } from "../utils/retry.ts";

/**
 * Map time range to Unix timestamp
 */
function mapTimeRangeToTimestamp(
  timeRange: HNSearchParams["timeRange"]
): number | null {
  const now = Math.floor(Date.now() / 1000);
  if (timeRange === "week") return now - 60 * 60 * 24 * 7;
  if (timeRange === "month") return now - 60 * 60 * 24 * 30;
  if (timeRange === "year") return now - 60 * 60 * 24 * 365;
  return null;
}

/**
 * Build numeric filters for Algolia query
 */
function buildNumericFilters(params: HNSearchParams): string {
  const filters: string[] = [];
  if (params.minUpvotes > 0) {
    filters.push(`points>=${params.minUpvotes}`);
  }
  const ts = mapTimeRangeToTimestamp(params.timeRange);
  if (ts) {
    filters.push(`created_at_i>=${ts}`);
  }
  return filters.join(",");
}

/**
 * Map sort option to Algolia endpoint
 */
function mapSortEndpoint(sortBy: HNSearchParams["sortBy"]): string {
  return sortBy === "recency" ? "search_by_date" : "search";
}

/**
 * Map tags array to Algolia format
 */
function mapTags(tags: string[]): string | undefined {
  if (!tags || tags.length === 0) return undefined;
  if (tags.length === 1) return tags[0];
  return `(${tags.join(",")})`;
}

/**
 * Fetch HN stories from Algolia
 */
export async function fetchHNStories(
  params: HNSearchParams,
  signal?: AbortSignal
): Promise<HNStory[]> {
  const endpoint = mapSortEndpoint(params.sortBy);
  const stories: HNStory[] = [];

  for (let page = 0; page < HN_MAX_PAGES; page++) {
    const url = new URL(`https://hn.algolia.com/api/v1/${endpoint}`);
    url.searchParams.set("query", params.topic);
    url.searchParams.set("page", String(page));
    url.searchParams.set("hitsPerPage", String(HN_HITS_PER_PAGE));
    url.searchParams.set("typoTolerance", "false");

    const tags = mapTags(params.tags);
    if (tags) url.searchParams.set("tags", tags);

    const numericFilters = buildNumericFilters(params);
    if (numericFilters) url.searchParams.set("numericFilters", numericFilters);

    const res = await fetch(url.toString(), { signal });
    if (!res.ok) {
      console.warn(`[fetchHNStories] Page ${page} failed: ${res.status}`);
      break;
    }

    const json = await res.json();
    const hits = json?.hits ?? [];
    if (!Array.isArray(hits) || hits.length === 0) break;

    for (const hit of hits) {
      const id = hit.objectID ?? hit.objectId ?? hit.id;
      if (!id) continue;

      stories.push({
        id: String(id),
        title: hit.title ?? hit.story_title ?? "",
        url: hit.url ?? hit.story_url ?? null,
        permalink: `https://news.ycombinator.com/item?id=${hit.story_id}`,
        text:
          typeof hit.story_text === "string"
            ? hit.story_text
            : typeof hit.text === "string"
            ? hit.text
            : null,
        points: typeof hit.points === "number" ? hit.points : 0,
        author: typeof hit.author === "string" ? hit.author : null,
        createdAt:
          typeof hit.created_at_i === "number"
            ? hit.created_at_i * 1000
            : Date.now(),
        tags: Array.isArray(hit._tags) ? hit._tags : [],
        numComments:
          typeof hit.num_comments === "number" ? hit.num_comments : 0,
      });
    }

    // Rate limiting
    await sleep(HN_PAGE_FETCH_DELAY_MS);
  }

  return stories;
}

/**
 * Fetch comments for a story
 */
export async function fetchHNComments(
  storyId: string,
  signal?: AbortSignal
): Promise<HNComment[]> {
  const res = await fetch(
    `https://hn.algolia.com/api/v1/items/${encodeURIComponent(storyId)}`,
    { signal }
  );

  if (!res.ok) return [];

  const json = await res.json();
  const children: unknown[] = json?.children ?? [];

  const comments: HNComment[] = [];
  for (const child of children) {
    if (!child || typeof child !== "object") continue;
    const c = child as Record<string, unknown>;

    if (typeof c.id === "undefined") continue;
    if (!c.text || typeof c.text !== "string") continue;

    comments.push({
      id: String(c.id),
      text: c.text as string,
      points: typeof c.points === "number" ? c.points : 0,
      author: typeof c.author === "string" ? c.author : null,
      createdAt:
        typeof c.created_at_i === "number"
          ? (c.created_at_i as number) * 1000
          : Date.now(),
      storyId,
      parentId: c.parent_id ? String(c.parent_id) : null,
      permalink: `https://news.ycombinator.com/item?id=${storyId}#${c.id}`,
    });
  }

  // Sort by points and limit
  comments.sort((a, b) => b.points - a.points);
  return comments.slice(0, HN_MAX_COMMENTS_PER_STORY);
}
