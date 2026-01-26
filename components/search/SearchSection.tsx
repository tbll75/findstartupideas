"use client";

import { useEffect, useCallback, useMemo, useRef } from "react";
import { useSearch, useSearchFilters, useSearchGate } from "./hooks";
import { SearchProgress } from "./SearchProgress";
import { SearchInput } from "./SearchInput";
import { SearchFilters } from "./SearchFilters";
import { SearchLoading } from "./SearchLoading";
import { SearchError } from "./SearchError";
import { LiveStoriesFeed } from "./LiveStoriesFeed";
import { LiveCommentsFeed } from "./LiveCommentsFeed";
import { LivePainPointsFeed } from "./LivePainPointsFeed";
import { ExampleSearchBadges } from "./ExampleSearchBadges";
import { EmailGateModal } from "./EmailGateModal";

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
    phase,
    stories,
    commentsCount,
    comments,
    painPointsIncremental,
    liveAnalysisSummary,
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

  const {
    isSubscribed,
    hasReachedLimit,
    shouldShowGate,
    incrementSearchCount,
    markAsSubscribed,
    canSearch,
    openGate,
    closeGate,
  } = useSearchGate();

  // Track pending search params when gate is shown
  const pendingSearchRef = useRef<{
    type: "url" | "manual" | "badge";
    params?: {
      topic: string;
      tags: string[];
      timeRange: string;
      minUpvotes: number;
      sortBy: string;
    };
  } | null>(null);

  /**
   * Execute a search with gate check
   */
  const executeSearch = useCallback(
    (params: {
      topic: string;
      tags: string[];
      timeRange: string;
      minUpvotes: number;
      sortBy: string;
    }) => {
      // Check if user can search
      if (!canSearch()) {
        // Store pending search and show gate
        pendingSearchRef.current = { type: "manual", params };
        openGate();
        return;
      }

      // Increment search count and perform search
      incrementSearchCount();
      performSearch(params);
    },
    [canSearch, incrementSearchCount, performSearch, openGate]
  );

  /**
   * Handle search trigger
   */
  const handleSearch = useCallback(() => {
    if (query.length < 2) return;

    // Check if user can search
    if (!canSearch()) {
      pendingSearchRef.current = { type: "manual" };
      openGate();
      return;
    }

    syncToUrl();
  }, [query, syncToUrl, canSearch, openGate]);

  /**
   * Handle search with a specific term (for badge clicks)
   */
  const handleSearchWithTerm = useCallback(
    (searchTerm: string) => {
      if (searchTerm.length < 2) return;

      const minUpvotesNum = Number(minUpvotes);
      const searchParams = {
        topic: searchTerm,
        tags: selectedTags,
        timeRange,
        minUpvotes: minUpvotesNum,
        sortBy,
      };

      // Check if user can search
      if (!canSearch()) {
        pendingSearchRef.current = { type: "badge", params: searchParams };
        openGate();
        return;
      }

      setQuery(searchTerm);
      // Update URL and trigger search
      const params = new URLSearchParams();
      params.set("q", searchTerm);
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
      if (timeRange !== "month") params.set("time", timeRange);
      if (minUpvotes !== "10") params.set("upvotes", minUpvotes);
      if (sortBy !== "relevance") params.set("sort", sortBy);

      window.history.pushState({}, "", `?${params.toString()}`);
      incrementSearchCount();
      performSearch(searchParams);
    },
    [
      setQuery,
      selectedTags,
      timeRange,
      minUpvotes,
      sortBy,
      performSearch,
      canSearch,
      openGate,
      incrementSearchCount,
    ]
  );

  /**
   * Handle successful email subscription
   */
  const handleGateSuccess = useCallback(() => {
    markAsSubscribed();

    // Execute pending search if any
    const pending = pendingSearchRef.current;
    if (pending) {
      pendingSearchRef.current = null;

      if (pending.type === "manual" && !pending.params) {
        // Manual search - sync to URL
        syncToUrl();
      } else if (pending.params) {
        // Badge or manual with params - execute directly
        if (pending.type === "badge") {
          setQuery(pending.params.topic);
          const params = new URLSearchParams();
          params.set("q", pending.params.topic);
          if (pending.params.tags.length > 0)
            params.set("tags", pending.params.tags.join(","));
          if (pending.params.timeRange !== "month")
            params.set("time", pending.params.timeRange);
          if (pending.params.minUpvotes !== 10)
            params.set("upvotes", pending.params.minUpvotes.toString());
          if (pending.params.sortBy !== "relevance")
            params.set("sort", pending.params.sortBy);
          window.history.pushState({}, "", `?${params.toString()}`);
        }
        performSearch(pending.params);
      }
    }
  }, [markAsSubscribed, syncToUrl, performSearch, setQuery]);

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

    const searchParams = {
      topic: urlQuery,
      tags: urlTags ? urlTags.split(",").filter(Boolean) : [],
      timeRange: urlTime || "month",
      minUpvotes: Number(urlUpvotes || "10"),
      sortBy: urlSort || "relevance",
    };

    // Check if user can search
    if (!canSearch()) {
      pendingSearchRef.current = { type: "url", params: searchParams };
      openGate();
      return;
    }

    // Perform search with URL parameters
    incrementSearchCount();
    performSearch(searchParams);
  }, [urlSearchParams, performSearch, resetSearch, canSearch, openGate, incrementSearchCount]);

  // Check if we have any live data to show
  const hasLiveData = useMemo(() => {
    return stories.length > 0 || comments.length > 0 || painPointsIncremental.length > 0;
  }, [stories.length, comments.length, painPointsIncremental.length]);

  // Remove debug logging
  // console.log("[SearchSection] State:", {
  //   isLoading,
  //   phase,
  //   storiesCount: stories.length,
  //   commentsCount,
  //   commentsLength: comments.length,
  //   painPointsCount: painPointsIncremental.length,
  //   showLiveFeeds: isLoading && !(searchResults && searchResults.length > 0),
  // });

  // Show live feeds when we have live data OR when loading (for brand new searches)
  // Keep them visible even when final results arrive
  const showLiveFeeds = useMemo(() => {
    return hasLiveData || isLoading;
  }, [hasLiveData, isLoading]);

  // Show initial loading only when loading, no error, and no live data yet
  const showInitialLoading = useMemo(() => {
    return isLoading && !errorMessage && !hasLiveData;
  }, [isLoading, errorMessage, hasLiveData]);

  return (
    <section className="relative pb-8 lg:pb-10">
      <SearchProgress progress={loadingProgress} phase={phase} />

      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        {/* Search Input */}
        <SearchInput
          query={query}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          isPolling={isPolling}
        />

        {/* Example Search Badges */}
        {!isLoading && query.length < 2 && !hasLiveData && (
          <ExampleSearchBadges onSelect={handleSearchWithTerm} />
        )}

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

        {/* Initial Loading State (before any data arrives) */}
        {showInitialLoading && (
          <SearchLoading
            isPolling={isPolling}
            phase={phase}
            storiesCount={stories.length}
            commentsCount={commentsCount}
          />
        )}

        {/* Live Feeds Section - Show when we have live data or when loading */}
        {showLiveFeeds && (
          <>
            {/* Phase 1: Live Stories Feed */}
            {stories.length > 0 && (
              <LiveStoriesFeed stories={stories} phase={phase} />
            )}

            {/* Phase 2: Live Comments Feed */}
            {(comments.length > 0 || commentsCount > 0 || phase === "comments" || phase === "analysis" || phase === "completed") && (
              <LiveCommentsFeed
                comments={comments}
                commentsCount={commentsCount}
                phase={phase}
              />
            )}

            {/* Phase 3: Live Pain Points Feed (AI Analysis) */}
            {(painPointsIncremental.length > 0 || phase === "analysis" || phase === "completed") && (
              <LivePainPointsFeed
                painPoints={painPointsIncremental}
                phase={phase}
                liveAnalysisSummary={liveAnalysisSummary}
                topic={urlSearchParams?.get("q") || query}
              />
            )}
          </>
        )}
      </div>

      {/* Email Gate Modal */}
      <EmailGateModal
        open={shouldShowGate}
        onOpenChange={closeGate}
        onSuccess={handleGateSuccess}
        hasReachedLimit={hasReachedLimit}
      />
    </section>
  );
}
