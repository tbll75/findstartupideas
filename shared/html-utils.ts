/**
 * HTML Utility Functions
 * Shared HTML processing utilities
 */

/**
 * Strip HTML tags and entities from a string
 * Used to clean HN comment text before processing
 *
 * @param input - String potentially containing HTML
 * @returns Clean text without HTML tags or entities
 *
 * @example
 * stripHtml('<p>Hello &amp; world</p>');
 * // Returns: 'Hello world'
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";

  return input
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/&[a-z]+;/gi, " ") // Replace HTML entities with space
    .replace(/\s+/g, " ") // Collapse multiple whitespace
    .trim();
}

/**
 * Truncate a string to a maximum length
 * @param input - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncateText(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength);
}

/**
 * Sanitize text for safe display (XSS prevention)
 * Escapes HTML special characters
 *
 * @param input - Potentially unsafe string
 * @returns HTML-safe string
 */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return input.replace(/[&<>"']/g, (char) => map[char] || char);
}
