/**
 * API Request and Response Types
 * Types for REST API endpoints
 */

import type { HNTag, TimeRange, SortBy, SearchStatus } from "./database";
import type { SearchResult } from "./search";

/**
 * POST /api/search request body
 */
export interface SearchRequest {
  topic: string;
  tags: HNTag[];
  timeRange: TimeRange;
  minUpvotes: number;
  sortBy: SortBy;
}

/**
 * POST /api/search response when search is initiated
 */
export interface SearchInitiatedResponse {
  searchId: string;
  status: SearchStatus;
  message?: string;
}

/**
 * GET /api/search-status response variants
 */
export type SearchStatusResponse =
  | {
      status: "pending";
      searchId: string;
      message?: string;
    }
  | {
      status: "processing";
      searchId: string;
      progress?: number;
      message?: string;
    }
  | {
      status: "completed";
      searchId: string;
      result: SearchResult;
    }
  | {
      status: "failed";
      searchId: string;
      error: string;
    };

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  issues?: Record<string, string[]>;
}

/**
 * Rate limit information returned in headers
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Edge function request body
 */
export interface EdgeFunctionRequest {
  searchId: string;
}

/**
 * Edge function response
 */
export interface EdgeFunctionResponse {
  status: "completed" | "failed" | "already_completed";
  searchId?: string;
  error?: string;
}
