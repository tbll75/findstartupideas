/**
 * Search Key Builder
 * Creates consistent cache keys for search queries
 * Used by both Next.js app and Edge Functions
 */

export interface SearchKeyInput {
  topic: string;
  tags: string[];
  timeRange: string;
  minUpvotes: number;
  sortBy: string;
}

/**
 * Build a deterministic search key for Redis/cache lookup
 * Normalizes the input to ensure consistent keys regardless of input order
 *
 * @param input - Search parameters
 * @returns A consistent string key for caching
 *
 * @example
 * buildSearchKey({
 *   topic: "React Hooks",
 *   tags: ["ask_hn", "story"],
 *   timeRange: "month",
 *   minUpvotes: 10,
 *   sortBy: "relevance"
 * });
 * // Returns: 'searchKey:{"minUpvotes":10,"sortBy":"relevance","tags":["ask_hn","story"],"timeRange":"month","topic":"react hooks"}'
 */
export function buildSearchKey(input: SearchKeyInput): string {
  const normalized = {
    topic: input.topic.toLowerCase().trim(),
    tags: [...(input.tags ?? [])].map((s) => s.toLowerCase()).sort(),
    timeRange: input.timeRange,
    minUpvotes: input.minUpvotes,
    sortBy: input.sortBy,
  };

  return `searchKey:${JSON.stringify(normalized)}`;
}
