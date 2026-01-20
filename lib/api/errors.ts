/**
 * API Error Handling
 * Standardized error types and handlers
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * API error codes for client-side handling
 */
export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  BAD_REQUEST: "BAD_REQUEST",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }

  /**
   * Convert to JSON response
   */
  toResponse(headers?: Record<string, string>): NextResponse {
    return NextResponse.json(
      {
        error: this.message,
        code: this.code,
        ...(this.details && { details: this.details }),
      },
      {
        status: this.statusCode,
        headers,
      }
    );
  }
}

/**
 * Create a validation error response from Zod error
 */
export function validationErrorResponse(error: ZodError): NextResponse {
  return NextResponse.json(
    {
      error: "Invalid request payload",
      code: ErrorCodes.VALIDATION_ERROR,
      issues: error.flatten().fieldErrors,
    },
    { status: 400 }
  );
}

/**
 * Create a rate limit error response
 */
export function rateLimitErrorResponse(
  message: string,
  headers: Record<string, string>,
  retryAfterSeconds: number
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
    },
    {
      status: 429,
      headers: {
        ...headers,
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}

/**
 * Create a not found error response
 */
export function notFoundErrorResponse(message: string = "Resource not found"): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: ErrorCodes.NOT_FOUND,
    },
    { status: 404 }
  );
}

/**
 * Create an internal error response
 */
export function internalErrorResponse(
  message: string = "Internal server error"
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: ErrorCodes.INTERNAL_ERROR,
    },
    { status: 500 }
  );
}

/**
 * Create a bad request error response
 */
export function badRequestErrorResponse(message: string): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: ErrorCodes.BAD_REQUEST,
    },
    { status: 400 }
  );
}

/**
 * Handle unknown errors and convert to response
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return error.toResponse();
  }

  if (error instanceof ZodError) {
    return validationErrorResponse(error);
  }

  console.error("[API Error]", error);

  return internalErrorResponse();
}
