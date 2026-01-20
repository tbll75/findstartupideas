/**
 * Input Sanitization Utilities
 * Prevents XSS and other injection attacks
 */

/**
 * HTML entities map for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * Escape HTML special characters to prevent XSS
 * Use this when rendering user-provided content
 *
 * @param input - Potentially unsafe string
 * @returns HTML-safe string
 */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip all HTML tags from a string
 * More aggressive than escaping - removes tags entirely
 *
 * @param input - String potentially containing HTML
 * @returns String with HTML tags removed
 */
export function stripHtmlTags(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "") // Remove style tags
    .replace(/<[^>]+>/g, "") // Remove all other tags
    .replace(/&[a-z]+;/gi, " ") // Replace HTML entities
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

/**
 * Sanitize a URL to prevent javascript: and data: protocol attacks
 *
 * @param url - URL to sanitize
 * @returns Safe URL or empty string if unsafe
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("vbscript:")
  ) {
    return "";
  }

  // Allow relative URLs and safe protocols
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:")
  ) {
    return url;
  }

  // Prepend https:// if no protocol specified
  if (!trimmed.includes("://")) {
    return `https://${url}`;
  }

  return "";
}

/**
 * Sanitize search topic input
 * Removes potentially dangerous characters
 *
 * @param topic - Raw topic input
 * @returns Sanitized topic
 */
export function sanitizeTopic(topic: string): string {
  return topic
    .replace(/[<>{}[\]\\]/g, "") // Remove dangerous characters
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim()
    .slice(0, 100); // Limit length
}

/**
 * Validate that a string is a valid UUID
 *
 * @param id - String to validate
 * @returns True if valid UUID
 */
export function isValidUuid(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Sanitize a quote before display
 * Preserves text but ensures XSS safety
 *
 * @param quote - Raw quote text
 * @param maxLength - Maximum length
 * @returns Sanitized quote
 */
export function sanitizeQuote(quote: string, maxLength = 800): string {
  return stripHtmlTags(quote).slice(0, maxLength);
}
