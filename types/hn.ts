/**
 * Hacker News API Types
 * Types for Algolia HN API responses and internal data structures
 */

import type { HNTag, TimeRange, SortBy } from "./database";

/**
 * Search parameters for HN API queries
 */
export interface HNSearchParams {
  topic: string;
  tags: HNTag[];
  timeRange: TimeRange;
  sortBy: SortBy;
  minUpvotes: number;
}

/**
 * Normalized HN Story from Algolia API
 */
export interface HNStory {
  id: string;
  title: string;
  url: string | null;
  text: string | null;
  points: number;
  author: string | null;
  createdAt: number;
  tags: string[];
  numComments: number;
}

/**
 * Normalized HN Comment from Algolia API
 */
export interface HNComment {
  id: string;
  text: string | null;
  points: number;
  author: string | null;
  createdAt: number;
  storyId: string;
  parentId: string | null;
  permalink: string;
}

/**
 * Raw Algolia search hit (partial type for fields we use)
 */
export interface AlgoliaHNHit {
  objectID?: string;
  objectId?: string;
  id?: string;
  title?: string;
  story_title?: string;
  url?: string;
  story_url?: string;
  story_text?: string;
  text?: string;
  points?: number;
  author?: string;
  created_at_i?: number;
  _tags?: string[];
  num_comments?: number;
}

/**
 * Raw Algolia search response
 */
export interface AlgoliaSearchResponse {
  hits: AlgoliaHNHit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
}

/**
 * Raw Algolia item response (for fetching comments)
 */
export interface AlgoliaItemResponse {
  id: number;
  title?: string;
  text?: string;
  author?: string;
  points?: number;
  created_at_i?: number;
  children?: AlgoliaItemChild[];
}

export interface AlgoliaItemChild {
  id?: number;
  text?: string;
  author?: string;
  points?: number;
  created_at_i?: number;
  parent_id?: number;
}

/**
 * Preferred HN tags in order of priority for tag picking
 */
export const PREFERRED_HN_TAGS: HNTag[] = [
  "ask_hn",
  "show_hn",
  "front_page",
  "poll",
  "story",
];

/**
 * Valid HN tags that can be used for filtering
 */
export const VALID_HN_TAGS: HNTag[] = [
  "story",
  "ask_hn",
  "show_hn",
  "front_page",
  "poll",
];
