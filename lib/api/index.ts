/**
 * API Module Exports
 */

// Errors
export {
  ErrorCodes,
  ApiError,
  validationErrorResponse,
  rateLimitErrorResponse,
  notFoundErrorResponse,
  internalErrorResponse,
  badRequestErrorResponse,
  handleApiError,
  type ErrorCode,
} from "./errors";

// Responses
export {
  successResponse,
  createdResponse,
  acceptedResponse,
  noContentResponse,
  searchResultResponse,
  searchProcessingResponse,
  searchFailedResponse,
} from "./responses";

// Request utilities
export {
  getClientIp,
  getRequestId,
  parseJsonBody,
  getQueryParam,
} from "./request-utils";
