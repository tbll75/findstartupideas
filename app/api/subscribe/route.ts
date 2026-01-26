import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  validationErrorResponse,
  internalErrorResponse,
  badRequestErrorResponse,
} from "@/lib/api";

// Constants
const NEWSLETTER_ENDPOINT =
  "https://us-central1-tmaker-hub.cloudfunctions.net/newsletter-subscribe";
const SOURCE = "findstartupideas.com";

// Email validation regex - RFC 5322 compliant (simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Request validation schema
const SubscribeRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(254, "Email is too long")
    .refine((email) => EMAIL_REGEX.test(email), "Invalid email format"),
  name: z
    .string()
    .max(100, "Name is too long")
    .regex(/^[a-zA-Z\s\-']*$/, "Name contains invalid characters")
    .optional()
    .transform((val) => val?.trim() || undefined),
});

/**
 * Sanitize input to prevent XSS and injection attacks
 */
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .slice(0, 255);
}

/**
 * POST /api/subscribe
 * Subscribe user to newsletter
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json().catch(() => null);

    if (!body) {
      return badRequestErrorResponse("Invalid request body");
    }

    // Sanitize inputs before validation
    const sanitizedBody = {
      email: typeof body.email === "string" ? sanitizeInput(body.email) : "",
      name: typeof body.name === "string" ? sanitizeInput(body.name) : undefined,
    };

    // Validate with Zod
    const parseResult = SubscribeRequestSchema.safeParse(sanitizedBody);

    if (!parseResult.success) {
      return validationErrorResponse(parseResult.error);
    }

    const { email, name } = parseResult.data;

    // Additional email domain validation (basic check for common typos)
    const emailParts = email.split("@");
    if (emailParts.length !== 2 || !emailParts[1].includes(".")) {
      return badRequestErrorResponse("Invalid email domain");
    }

    // Prepare payload for external API
    const payload = {
      email,
      name: name || "",
      source: SOURCE,
    };

    // Call external newsletter API
    const response = await fetch(NEWSLETTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Handle response from external API
    if (!response.ok) {
      // Log the error but don't expose internal details to client
      console.error(
        "[POST /api/subscribe] External API error:",
        response.status,
        await response.text().catch(() => "")
      );

      // Return a user-friendly error
      // Note: Per requirements, frontend will still mark user as subscribed
      return NextResponse.json(
        { error: "Something went wrong — but you're good to go!" },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        message: "Successfully subscribed",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/subscribe] Unexpected error:", error);
    return internalErrorResponse("Something went wrong — but you're good to go!");
  }
}
