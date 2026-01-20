/**
 * Result Transformation Utilities
 * Transform API results to UI-friendly format
 */

import type { SearchResult, SearchResultItem } from "@/types";

/**
 * Transform SearchResult to UI format
 * Groups quotes by pain point and maps to display format
 */
export function transformSearchResult(result: SearchResult): SearchResultItem[] {
  // Group quotes by pain point
  const quotesByPainPoint = new Map<
    string,
    Array<{
      text: string;
      upvotes: number;
      author: string;
      permalink?: string;
    }>
  >();

  result.quotes.forEach((quote) => {
    if (!quotesByPainPoint.has(quote.painPointId)) {
      quotesByPainPoint.set(quote.painPointId, []);
    }
    const quoteData: {
      text: string;
      upvotes: number;
      author: string;
      permalink?: string;
    } = {
      text: quote.quoteText,
      upvotes: quote.upvotes,
      author: quote.authorHandle || "Anonymous",
    };
    if (quote.permalink) {
      quoteData.permalink = quote.permalink;
    }
    quotesByPainPoint.get(quote.painPointId)!.push(quoteData);
  });

  // Map pain points to UI format
  return result.painPoints.map((pp, idx) => ({
    id: idx + 1,
    painTitle: pp.title,
    mentions: pp.mentionsCount,
    tag: pp.sourceTag,
    quotes: quotesByPainPoint.get(pp.id) || [],
  }));
}

/**
 * Get human-readable label for HN tag
 */
export function getHNTagLabel(tag: string): string {
  const tagLabels: Record<string, string> = {
    hackernews: "Hacker News",
    story: "Stories",
    ask_hn: "Ask HN",
    show_hn: "Show HN",
    front_page: "Front Page",
    poll: "Polls",
  };

  if (tagLabels[tag]) {
    return tagLabels[tag];
  }

  // Fallback: prettify unknown tags like "some_tag" -> "Some Tag"
  return tag.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * HN tag options for filter UI
 */
export const HN_TAG_OPTIONS = [
  { value: "story", label: "Stories" },
  { value: "ask_hn", label: "Ask HN" },
  { value: "show_hn", label: "Show HN" },
  { value: "front_page", label: "Front Page" },
  { value: "poll", label: "Polls" },
] as const;

/**
 * Time range options for filter UI
 */
export const TIME_RANGE_OPTIONS = [
  { value: "week", label: "Past Week" },
  { value: "month", label: "Past Month" },
  { value: "year", label: "Past Year" },
  { value: "all", label: "All Time" },
] as const;

/**
 * Sort options for filter UI
 */
export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "upvotes", label: "Upvotes" },
  { value: "recency", label: "Recency" },
] as const;

/**
 * Min upvotes options for filter UI
 */
export const MIN_UPVOTES_OPTIONS = ["0", "10", "50", "100", "500"] as const;
