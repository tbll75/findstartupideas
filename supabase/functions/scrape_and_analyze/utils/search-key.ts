/**
 * Search Key Builder
 * Creates consistent cache keys for search queries
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
 */
export function buildSearchKey(input: SearchKeyInput): string {
  const topic = input.topic.trim().toLowerCase();
  const tags = [...(input.tags ?? [])].map((s) => s.toLowerCase()).sort();

  const payload = {
    topic,
    tags,
    timeRange: input.timeRange,
    minUpvotes: input.minUpvotes,
    sortBy: input.sortBy,
  };

  return `searchKey:${JSON.stringify(payload)}`;
}
