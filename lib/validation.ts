import { z } from "zod";

/**
 * Shared Zod schemas for search input and output.
 * These act as the contract between the frontend, API routes,
 * database layer, and any caching layer.
 */

export const timeRangeEnum = z.enum(["week", "month", "year", "all"]);

export const sortByEnum = z.enum(["relevance", "upvotes", "recency"]);

export const SearchRequestSchema = z
  .object({
    topic: z
      .string()
      .min(2, "Topic must be at least 2 characters long")
      .max(100, "Topic must be at most 100 characters long")
      .transform((value) => value.trim())
      .refine((value) => value.length > 0, {
        message: "Topic cannot be empty",
      }),
    subreddits: z
      .array(z.string().regex(/^[A-Za-z0-9_]{2,21}$/, "Invalid subreddit name"))
      .max(10, "You can specify at most 10 subreddits")
      .optional()
      .default([]),
    timeRange: timeRangeEnum.default("month"),
    minUpvotes: z
      .number()
      .int()
      .min(0, "Minimum upvotes cannot be negative")
      .max(10000, "Minimum upvotes is too large")
      .default(0),
    sortBy: sortByEnum.default("relevance"),
  })
  .strict();

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

const PainPointSchema = z.object({
  id: z.string().uuid(),
  searchId: z.string().uuid(),
  title: z.string(),
  subreddit: z.string(),
  mentionsCount: z.number().int().nonnegative(),
  severityScore: z.number().min(0).max(10).optional(),
});

const PainPointQuoteSchema = z.object({
  id: z.string().uuid(),
  painPointId: z.string().uuid(),
  quoteText: z.string(),
  authorHandle: z.string().nullable(),
  upvotes: z.number().int().nonnegative(),
  permalink: z.string().url(),
});

const ProductIdeaSchema = z.object({
  title: z.string(),
  description: z.string(),
  targetUser: z.string().optional(),
  impactScore: z.number().min(0).max(10).optional(),
});

const ProblemClusterSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
  description: z.string(),
  severityScore: z.number().min(0).max(10).optional(),
  painPointIds: z.array(z.string().uuid()).optional(),
});

const AiAnalysisSchema = z.object({
  summary: z.string(),
  problemClusters: z.array(ProblemClusterSchema),
  productIdeas: z.array(ProductIdeaSchema),
  model: z.string().optional(),
  tokensUsed: z.number().int().nonnegative().optional(),
});

/**
 * Full assembled search result the API returns to the UI
 * and/or stores in Redis.
 */
export const SearchResultSchema = z.object({
  searchId: z.string().uuid(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  topic: z.string(),
  subreddits: z.array(z.string()),
  timeRange: timeRangeEnum,
  minUpvotes: z.number().int().min(0),
  sortBy: sortByEnum,
  totalMentions: z.number().int().nonnegative().optional(),
  totalPostsConsidered: z.number().int().nonnegative().optional(),
  totalCommentsConsidered: z.number().int().nonnegative().optional(),
  sourceSubreddits: z.array(z.string()).optional(),
  painPoints: z.array(PainPointSchema),
  quotes: z.array(PainPointQuoteSchema),
  analysis: AiAnalysisSchema.optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

