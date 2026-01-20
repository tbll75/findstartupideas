/**
 * Zod Enum Schemas
 * Reusable enum definitions for validation
 */

import { z } from "zod";

/**
 * Time range for search filtering
 */
export const timeRangeEnum = z.enum(["week", "month", "year", "all"]);
export type TimeRangeEnum = z.infer<typeof timeRangeEnum>;

/**
 * Sort options for search results
 */
export const sortByEnum = z.enum(["relevance", "upvotes", "recency"]);
export type SortByEnum = z.infer<typeof sortByEnum>;

/**
 * Hacker News tag types
 */
export const hnTagsEnum = z.enum([
  "story",
  "ask_hn",
  "show_hn",
  "front_page",
  "poll",
]);
export type HNTagEnum = z.infer<typeof hnTagsEnum>;

/**
 * Search status states
 */
export const statusEnum = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);
export type StatusEnum = z.infer<typeof statusEnum>;

/**
 * Log levels for job logging
 */
export const logLevelEnum = z.enum(["info", "error", "warn"]);
export type LogLevelEnum = z.infer<typeof logLevelEnum>;
