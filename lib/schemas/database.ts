/**
 * Database Row Schemas
 * Zod schemas matching Supabase table structures
 */

import { z } from "zod";
import { timeRangeEnum, sortByEnum, statusEnum } from "./enums";

/**
 * Matches the `searches` table row
 */
export const SearchRowSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
  topic: z.string(),
  subreddits: z.array(z.string()).nullable(),
  time_range: timeRangeEnum,
  min_upvotes: z.number().int(),
  sort_by: sortByEnum,
  client_fingerprint: z.string().nullable(),
  status: statusEnum,
  error_message: z.string().nullable(),
  retry_count: z.number().int().default(0),
  last_retry_at: z.string().datetime().nullable(),
  next_retry_at: z.string().datetime().nullable(),
});

export type SearchRowType = z.infer<typeof SearchRowSchema>;

/**
 * Matches the `search_results` table row
 */
export const SearchResultsRowSchema = z.object({
  id: z.string().uuid(),
  search_id: z.string().uuid(),
  total_mentions: z.number().int().nullable(),
  total_posts_considered: z.number().int().nullable(),
  total_comments_considered: z.number().int().nullable(),
  source_subreddits: z.array(z.string()).nullable(),
  source_tags: z.array(z.string()).nullable(),
});

export type SearchResultsRowType = z.infer<typeof SearchResultsRowSchema>;

/**
 * Matches the `pain_points` table row
 */
export const PainPointRowSchema = z.object({
  id: z.string().uuid(),
  search_id: z.string().uuid(),
  title: z.string(),
  subreddit: z.string(),
  mentions_count: z.number().int(),
  severity_score: z.number().nullable(),
});

export type PainPointRowType = z.infer<typeof PainPointRowSchema>;

/**
 * Matches the `pain_point_quotes` table row
 */
export const PainPointQuoteRowSchema = z.object({
  id: z.string().uuid(),
  pain_point_id: z.string().uuid(),
  quote_text: z.string(),
  author_handle: z.string().nullable(),
  upvotes: z.number().int(),
  permalink: z.string(),
});

export type PainPointQuoteRowType = z.infer<typeof PainPointQuoteRowSchema>;

/**
 * Matches the `ai_analyses` table row
 */
export const AiAnalysisRowSchema = z.object({
  id: z.string().uuid(),
  search_id: z.string().uuid(),
  summary: z.string(),
  problem_clusters: z.unknown(), // JSONB - will be parsed with ProblemClusterSchema
  product_ideas: z.unknown(), // JSONB - will be parsed with ProductIdeaSchema
  model: z.string().nullable(),
  tokens_used: z.number().int().nullable(),
  created_at: z.string().datetime().optional(),
});

export type AiAnalysisRowType = z.infer<typeof AiAnalysisRowSchema>;
