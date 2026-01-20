/**
 * API Response Schemas
 * Zod schemas for REST API responses
 */

import { z } from "zod";
import { statusEnum } from "./enums";
import { SearchResultSchema } from "./search";

/**
 * Response from POST /api/search (immediate response)
 */
export const SearchInitiatedResponseSchema = z.object({
  searchId: z.string().uuid(),
  status: statusEnum,
  message: z.string().optional(),
});

export type SearchInitiatedResponseType = z.infer<
  typeof SearchInitiatedResponseSchema
>;

/**
 * Response from GET /api/search-status?searchId=...
 */
export const SearchStatusResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("pending"),
    searchId: z.string().uuid(),
    message: z.string().optional(),
  }),
  z.object({
    status: z.literal("processing"),
    searchId: z.string().uuid(),
    progress: z.number().min(0).max(100).optional(),
    message: z.string().optional(),
  }),
  z.object({
    status: z.literal("completed"),
    searchId: z.string().uuid(),
    result: SearchResultSchema,
  }),
  z.object({
    status: z.literal("failed"),
    searchId: z.string().uuid(),
    error: z.string(),
  }),
]);

export type SearchStatusResponseType = z.infer<
  typeof SearchStatusResponseSchema
>;

/**
 * Standard API error response
 */
export const ApiErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  issues: z.record(z.array(z.string())).optional(),
});

export type ApiErrorResponseType = z.infer<typeof ApiErrorResponseSchema>;
