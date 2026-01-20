/**
 * Validation Module (Backward Compatibility)
 *
 * This file re-exports from the new modular schema structure.
 * New code should import directly from @/lib/schemas and @/lib/validators.
 *
 * @deprecated Import from @/lib/schemas and @/lib/validators instead
 */

// Re-export enums
export {
  timeRangeEnum,
  sortByEnum,
  hnTagsEnum,
  statusEnum,
} from "./schemas/enums";

// Re-export search schemas and types
export {
  SearchRequestSchema,
  PainPointSchema,
  PainPointQuoteSchema,
  ProblemClusterSchema,
  ProductIdeaSchema,
  AiAnalysisSchema,
  SearchResultSchema,
  type SearchRequestType as SearchRequest,
  type PainPointType as PainPoint,
  type PainPointQuoteType as PainPointQuote,
  type ProblemClusterType as ProblemCluster,
  type ProductIdeaType as ProductIdea,
  type AiAnalysisType as AiAnalysis,
  type SearchResultType as SearchResult,
} from "./schemas/search";

// Re-export database row schemas
export {
  SearchRowSchema,
  SearchResultsRowSchema,
  PainPointRowSchema,
  PainPointQuoteRowSchema,
  AiAnalysisRowSchema,
  type SearchRowType as SearchRow,
  type SearchResultsRowType as SearchResultsRow,
  type PainPointRowType as PainPointRow,
  type PainPointQuoteRowType as PainPointQuoteRow,
  type AiAnalysisRowType as AiAnalysisRow,
} from "./schemas/database";

// Re-export API schemas
export {
  SearchInitiatedResponseSchema,
  SearchStatusResponseSchema,
  type SearchInitiatedResponseType as SearchInitiatedResponse,
  type SearchStatusResponseType as SearchStatusResponse,
} from "./schemas/api";

// Re-export validators
export {
  safeParse,
  parseProblemClusters,
  parseProductIdeas,
  validateSearchRequest,
  validateSearchResult,
  isCompleted,
  isFailed,
  isProcessing,
  isPending,
} from "./validators";

// Re-export buildSearchKey from shared
export { buildSearchKey } from "@/shared/search-key";
