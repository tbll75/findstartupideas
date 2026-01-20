/**
 * Search Schemas
 * Zod schemas for search requests and results
 */

import { z } from "zod";
import { timeRangeEnum, sortByEnum, hnTagsEnum, statusEnum } from "./enums";
import {
  TOPIC_MIN_LENGTH,
  TOPIC_MAX_LENGTH,
  MAX_TAGS,
  MAX_UPVOTES_FILTER,
} from "@/shared/constants";

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

/**
 * Search request validation schema
 */
export const SearchRequestSchema = z
  .object({
    topic: z
      .string()
      .min(TOPIC_MIN_LENGTH, `Topic must be at least ${TOPIC_MIN_LENGTH} characters long`)
      .max(TOPIC_MAX_LENGTH, `Topic must be at most ${TOPIC_MAX_LENGTH} characters long`)
      .transform((value) => value.trim())
      .refine((value) => value.length > 0, {
        message: "Topic cannot be empty",
      })
      .refine((value) => !/[<>{}[\]\\]/.test(value), {
        message: "Topic contains invalid characters",
      }),
    tags: z
      .array(hnTagsEnum)
      .max(MAX_TAGS, `You can specify at most ${MAX_TAGS} tags`)
      .default([]),
    timeRange: timeRangeEnum.default("month"),
    minUpvotes: z
      .number()
      .int()
      .min(0, "Minimum upvotes cannot be negative")
      .max(MAX_UPVOTES_FILTER, "Minimum upvotes is too large")
      .default(0),
    sortBy: sortByEnum.default("relevance"),
  })
  .strict();

export type SearchRequestType = z.infer<typeof SearchRequestSchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Pain point schema
 */
export const PainPointSchema = z.object({
  id: z.string().uuid(),
  searchId: z.string().uuid(),
  title: z.string(),
  sourceTag: z.string(),
  mentionsCount: z.number().int().nonnegative(),
  severityScore: z.number().min(0).max(10).optional(),
});

export type PainPointType = z.infer<typeof PainPointSchema>;

/**
 * Quote supporting a pain point
 */
export const PainPointQuoteSchema = z.object({
  id: z.string().uuid(),
  painPointId: z.string().uuid(),
  quoteText: z.string(),
  authorHandle: z.string().nullable(),
  upvotes: z.number().int().nonnegative(),
  permalink: z.string().url(),
});

export type PainPointQuoteType = z.infer<typeof PainPointQuoteSchema>;

/**
 * Problem cluster from Gemini analysis
 */
export const ProblemClusterSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: z.number().min(0).max(10),
  mentionCount: z.number().int().nonnegative(),
  examples: z.array(z.string()),
});

export type ProblemClusterType = z.infer<typeof ProblemClusterSchema>;

/**
 * Product idea from AI
 */
export const ProductIdeaSchema = z.object({
  title: z.string(),
  description: z.string(),
  targetProblem: z.string(),
  impactScore: z.number().min(0).max(10),
});

export type ProductIdeaType = z.infer<typeof ProductIdeaSchema>;

/**
 * Complete AI analysis
 */
export const AiAnalysisSchema = z.object({
  summary: z.string(),
  problemClusters: z.array(ProblemClusterSchema),
  productIdeas: z.array(ProductIdeaSchema),
  model: z.string().optional(),
  tokensUsed: z.number().int().nonnegative().optional(),
});

export type AiAnalysisType = z.infer<typeof AiAnalysisSchema>;

/**
 * Full assembled search result
 */
export const SearchResultSchema = z.object({
  searchId: z.string().uuid(),
  status: statusEnum,
  topic: z.string(),
  tags: z.array(hnTagsEnum),
  timeRange: timeRangeEnum,
  minUpvotes: z.number().int().min(0),
  sortBy: sortByEnum,
  totalMentions: z.number().int().nonnegative().optional(),
  totalPostsConsidered: z.number().int().nonnegative().optional(),
  totalCommentsConsidered: z.number().int().nonnegative().optional(),
  sourceTags: z.array(z.string()).optional(),
  painPoints: z.array(PainPointSchema),
  quotes: z.array(PainPointQuoteSchema),
  analysis: AiAnalysisSchema.optional(),
  errorMessage: z.string().optional(),
});

export type SearchResultType = z.infer<typeof SearchResultSchema>;
