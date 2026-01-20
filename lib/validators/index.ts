/**
 * Validation Helper Functions
 * Utilities for validating and parsing data with Zod
 */

import { z } from "zod";
import {
  SearchRequestSchema,
  SearchResultSchema,
  ProblemClusterSchema,
  ProductIdeaSchema,
  SearchStatusResponseSchema,
  type SearchRequestType,
  type SearchResultType,
  type ProblemClusterType,
  type ProductIdeaType,
  type SearchStatusResponseType,
} from "@/lib/schemas";

/**
 * Safely parse unknown data with Zod schema and return null on failure
 * @param schema - Zod schema to validate against
 * @param data - Unknown data to parse
 * @returns Parsed data or null on validation failure
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error("Zod validation failed:", result.error);
  return null;
}

/**
 * Parse and validate Gemini's JSONB problem_clusters from database
 * @param raw - Raw JSONB data from database
 * @returns Array of validated problem clusters
 */
export function parseProblemClusters(raw: unknown): ProblemClusterType[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => safeParse(ProblemClusterSchema, item))
    .filter((item): item is ProblemClusterType => item !== null);
}

/**
 * Parse and validate Gemini's JSONB product_ideas from database
 * @param raw - Raw JSONB data from database
 * @returns Array of validated product ideas
 */
export function parseProductIdeas(raw: unknown): ProductIdeaType[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => safeParse(ProductIdeaSchema, item))
    .filter((item): item is ProductIdeaType => item !== null);
}

/**
 * Validate and sanitize search request from user
 * @param input - Unknown input data
 * @returns Validated search request or null
 */
export function validateSearchRequest(
  input: unknown
): SearchRequestType | null {
  const parsed = safeParse(SearchRequestSchema, input);
  if (!parsed) return null;

  // Normalize to a fully-populated `SearchRequest`
  return {
    topic: parsed.topic,
    tags: parsed.tags ?? [],
    timeRange: parsed.timeRange ?? "month",
    minUpvotes: parsed.minUpvotes ?? 0,
    sortBy: parsed.sortBy ?? "relevance",
  };
}

/**
 * Validate search result before caching or returning to frontend
 * @param data - Unknown data to validate
 * @returns Validated search result or null
 */
export function validateSearchResult(data: unknown): SearchResultType | null {
  return safeParse(SearchResultSchema, data);
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for completed search status response
 */
export function isCompleted(
  response: SearchStatusResponseType
): response is Extract<SearchStatusResponseType, { status: "completed" }> {
  return response.status === "completed";
}

/**
 * Type guard for failed search status response
 */
export function isFailed(
  response: SearchStatusResponseType
): response is Extract<SearchStatusResponseType, { status: "failed" }> {
  return response.status === "failed";
}

/**
 * Type guard for processing search status response
 */
export function isProcessing(
  response: SearchStatusResponseType
): response is Extract<SearchStatusResponseType, { status: "processing" }> {
  return response.status === "processing";
}

/**
 * Type guard for pending search status response
 */
export function isPending(
  response: SearchStatusResponseType
): response is Extract<SearchStatusResponseType, { status: "pending" }> {
  return response.status === "pending";
}
