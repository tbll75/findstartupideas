/**
 * Request Utilities
 * Helper functions for processing HTTP requests
 */

import { NextRequest } from "next/server";

/**
 * Extended NextRequest type with ip property (available on Vercel)
 */
interface NextRequestWithIp extends NextRequest {
  ip?: string;
}

/**
 * Extract client IP address from request
 * Handles various proxy configurations and edge deployments
 *
 * @param req - Next.js request object
 * @returns Client IP address or "unknown"
 */
export function getClientIp(req: NextRequest): string {
  // Check X-Forwarded-For header (standard proxy header)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP (original client)
    const ip = forwardedFor.split(",")[0]?.trim();
    if (ip) return ip;
  }

  // Check X-Real-IP header (alternative)
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Check CF-Connecting-IP header (Cloudflare)
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }

  // Next.js on Vercel exposes req.ip
  const reqWithIp = req as NextRequestWithIp;
  if (typeof reqWithIp.ip === "string" && reqWithIp.ip.length > 0) {
    return reqWithIp.ip;
  }

  return "unknown";
}

/**
 * Generate a request ID for tracing
 * Uses the X-Request-ID header if present, otherwise generates a new one
 *
 * @param req - Next.js request object
 * @returns Request ID
 */
export function getRequestId(req: NextRequest): string {
  const existingId = req.headers.get("x-request-id");
  if (existingId) {
    return existingId;
  }

  // Generate a simple random ID
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Parse JSON body safely
 * Returns null if parsing fails
 *
 * @param req - Next.js request object
 * @returns Parsed body or null
 */
export async function parseJsonBody<T = unknown>(
  req: NextRequest
): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Get query parameter
 * @param req - Next.js request object
 * @param name - Parameter name
 * @returns Parameter value or null
 */
export function getQueryParam(req: NextRequest, name: string): string | null {
  const { searchParams } = new URL(req.url);
  return searchParams.get(name);
}
