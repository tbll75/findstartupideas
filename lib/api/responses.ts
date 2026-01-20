/**
 * API Response Helpers
 * Standardized response builders for consistent API responses
 */

import { NextResponse } from "next/server";
import type { SearchResult } from "@/types";

/**
 * Success response with data
 */
export function successResponse<T>(
  data: T,
  headers?: Record<string, string>
): NextResponse<T> {
  return NextResponse.json(data, {
    status: 200,
    headers,
  });
}

/**
 * Created response (201)
 */
export function createdResponse<T>(
  data: T,
  headers?: Record<string, string>
): NextResponse<T> {
  return NextResponse.json(data, {
    status: 201,
    headers,
  });
}

/**
 * Accepted response for async processing (202)
 */
export function acceptedResponse<T>(
  data: T,
  headers?: Record<string, string>
): NextResponse<T> {
  return NextResponse.json(data, {
    status: 202,
    headers,
  });
}

/**
 * No content response (204)
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Search result response
 */
export function searchResultResponse(
  result: SearchResult,
  headers?: Record<string, string>
): NextResponse {
  return successResponse(result, headers);
}

/**
 * Search initiated/processing response
 */
export function searchProcessingResponse(
  searchId: string,
  status: "pending" | "processing",
  headers?: Record<string, string>,
  errorMessage?: string
): NextResponse {
  return acceptedResponse(
    {
      searchId,
      status,
      ...(errorMessage && { errorMessage }),
    },
    headers
  );
}

/**
 * Search failed response
 */
export function searchFailedResponse(
  searchId: string,
  errorMessage: string,
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    {
      searchId,
      status: "failed" as const,
      errorMessage,
    },
    {
      status: 500,
      headers,
    }
  );
}
