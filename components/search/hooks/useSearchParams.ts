"use client";

import { useState, useCallback, useEffect } from "react";
import {
  useRouter,
  useSearchParams as useNextSearchParams,
} from "next/navigation";

export interface SearchFilters {
  query: string;
  selectedTags: string[];
  timeRange: string;
  minUpvotes: string;
  sortBy: string;
}

export interface SearchParamsActions {
  setQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  setTimeRange: (timeRange: string) => void;
  setMinUpvotes: (minUpvotes: string) => void;
  setSortBy: (sortBy: string) => void;
  syncToUrl: () => void;
}

/**
 * Hook for managing search parameters and URL synchronization
 */
export function useSearchFilters(): SearchFilters &
  SearchParamsActions & {
    urlSearchParams: URLSearchParams | null;
  } {
  const router = useRouter();
  const searchParams = useNextSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState("month");
  const [minUpvotes, setMinUpvotes] = useState("10");
  const [sortBy, setSortBy] = useState("relevance");

  // Sync state from URL params on mount and when URL changes
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    const urlTags = searchParams.get("tags");
    const urlTime = searchParams.get("time");
    const urlUpvotes = searchParams.get("upvotes");
    const urlSort = searchParams.get("sort");

    if (urlQuery) setQuery(urlQuery);
    if (urlTags) setSelectedTags(urlTags.split(",").filter(Boolean));
    if (urlTime) setTimeRange(urlTime);
    if (urlUpvotes) setMinUpvotes(urlUpvotes);
    if (urlSort) setSortBy(urlSort);
  }, [searchParams]);

  /**
   * Toggle a tag in the selected tags
   */
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  /**
   * Sync current filters to URL
   */
  const syncToUrl = useCallback(() => {
    if (query.length < 2) return;

    const params = new URLSearchParams();
    params.set("q", query);
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
    if (timeRange !== "month") params.set("time", timeRange);
    if (minUpvotes !== "10") params.set("upvotes", minUpvotes);
    if (sortBy !== "relevance") params.set("sort", sortBy);

    router.push(`?${params.toString()}`, { scroll: false });
  }, [query, selectedTags, timeRange, minUpvotes, sortBy, router]);

  return {
    query,
    selectedTags,
    timeRange,
    minUpvotes,
    sortBy,
    setQuery,
    setSelectedTags,
    toggleTag,
    setTimeRange,
    setMinUpvotes,
    setSortBy,
    syncToUrl,
    urlSearchParams: searchParams,
  };
}
