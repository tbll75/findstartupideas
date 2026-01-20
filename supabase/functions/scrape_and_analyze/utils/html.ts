/**
 * HTML Utilities
 */

/**
 * Strip HTML tags and entities from a string
 *
 * @param input - String potentially containing HTML
 * @returns Clean text without HTML tags or entities
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";

  return input
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/&[a-z]+;/gi, " ") // Replace HTML entities with space
    .replace(/\s+/g, " ") // Collapse multiple whitespace
    .trim();
}
