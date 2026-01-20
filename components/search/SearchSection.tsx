"use client";

import { useEffect, useCallback } from "react";
import { useSearch, useSearchFilters } from "./hooks";
import { SearchProgress } from "./SearchProgress";
import { SearchInput } from "./SearchInput";
import { SearchFilters } from "./SearchFilters";
import { SearchResults } from "./SearchResults";
import { SearchLoading } from "./SearchLoading";
import { SearchError } from "./SearchError";

/**
 * Main search section component
 * Orchestrates search functionality with modular subcomponents
 */
export function SearchSection() {
  const {
    isLoading,
    isPolling,
    searchResults,
    errorMessage,
    loadingProgress,
    performSearch,
    resetSearch,
  } = useSearch();

  const {
    query,
    selectedTags,
    timeRange,
    minUpvotes,
    sortBy,
    setQuery,
    toggleTag,
    setTimeRange,
    setMinUpvotes,
    setSortBy,
    syncToUrl,
    urlSearchParams,
  } = useSearchFilters();

  /**
   * Handle search trigger
   */
  const handleSearch = useCallback(() => {
    if (query.length < 2) return;
    syncToUrl();
  }, [query, syncToUrl]);

  /**
   * Perform search when URL parameters change
   */
  useEffect(() => {
    const urlQuery = urlSearchParams?.get("q");
    const urlTags = urlSearchParams?.get("tags");
    const urlTime = urlSearchParams?.get("time");
    const urlUpvotes = urlSearchParams?.get("upvotes");
    const urlSort = urlSearchParams?.get("sort");

    // No valid query in URL – reset search state
    if (!urlQuery || urlQuery.length < 2) {
      resetSearch();
      return;
    }

    // Perform search with URL parameters
    performSearch({
      topic: urlQuery,
      tags: urlTags ? urlTags.split(",").filter(Boolean) : [],
      timeRange: urlTime || "month",
      minUpvotes: Number(urlUpvotes || "10"),
      sortBy: urlSort || "relevance",
    });
  }, [urlSearchParams, performSearch, resetSearch]);

  const showResults = searchResults && searchResults.length > 0;

  return (
    <section className="relative pb-8 lg:pb-10">
      <SearchProgress progress={loadingProgress} />

      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        {/* Search Input */}
        <SearchInput
          query={query}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          isPolling={isPolling}
        />

        {/* Advanced Filters */}
        <SearchFilters
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          minUpvotes={minUpvotes}
          onMinUpvotesChange={setMinUpvotes}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />

        {/* Error Message */}
        {errorMessage && <SearchError message={errorMessage} />}

        {/* Loading State */}
        {isLoading && !errorMessage && <SearchLoading isPolling={isPolling} />}

        {/* Results */}
        {showResults && <SearchResults results={searchResults} query={query} />}
      </div>
    </section>
  );
}
