/**
 * Central type exports for Find Startup Ideas
 *
 * Usage:
 * import type { SearchResult, PainPoint, HNStory } from "@/types";
 */

// Database types
export type {
  Database,
  Json,
  SearchStatus,
  TimeRange,
  SortBy,
  HNTag,
  LogLevel,
  SearchRow,
  SearchInsert,
  SearchUpdate,
  SearchResultsRow,
  SearchResultsInsert,
  PainPointRow,
  PainPointInsert,
  PainPointQuoteRow,
  PainPointQuoteInsert,
  AiAnalysisRow,
  AiAnalysisInsert,
  JobLogRow,
  JobLogInsert,
  ApiUsageRow,
  ApiUsageInsert,
} from "./database";

// Hacker News types
export type {
  HNSearchParams,
  HNStory,
  HNComment,
  AlgoliaHNHit,
  AlgoliaSearchResponse,
  AlgoliaItemResponse,
  AlgoliaItemChild,
} from "./hn";

export { PREFERRED_HN_TAGS, VALID_HN_TAGS } from "./hn";

// Search/domain types
export type {
  PainPoint,
  PainPointQuote,
  ProblemCluster,
  ProductIdea,
  AiAnalysis,
  SearchResult,
  SearchResultItem,
} from "./search";

// API types
export type {
  SearchRequest,
  SearchInitiatedResponse,
  SearchStatusResponse,
  ApiErrorResponse,
  RateLimitInfo,
  EdgeFunctionRequest,
  EdgeFunctionResponse,
} from "./api";
