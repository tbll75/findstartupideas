/**
 * Hacker News Utilities
 */

import type { HNStory } from "../types.ts";

/**
 * Preferred HN tags in order of priority
 */
const PREFERRED_TAGS = ["ask_hn", "show_hn", "front_page", "poll", "story"];

/**
 * Pick the primary tag for a story
 */
export function pickPrimaryTag(story: HNStory): string {
  for (const t of PREFERRED_TAGS) {
    if (story.tags?.includes(t)) return t;
  }
  return "story";
}

/**
 * Calculate tag distribution from stories
 */
export function calculateTagDistribution(
  stories: HNStory[]
): Map<string, number> {
  const tagCounts = new Map<string, number>();

  for (const story of stories) {
    const tag = pickPrimaryTag(story);
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  }

  return tagCounts;
}

/**
 * Get sorted tags by frequency
 */
export function getSortedTags(stories: HNStory[]): string[] {
  const tagCounts = calculateTagDistribution(stories);

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

/**
 * Get all unique source tags from stories
 */
export function getSourceTags(stories: HNStory[]): Set<string> {
  const sourceTags = new Set<string>();

  for (const story of stories) {
    (story.tags ?? []).forEach((t) => sourceTags.add(t));
  }

  return sourceTags;
}
