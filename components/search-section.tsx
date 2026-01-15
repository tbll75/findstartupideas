"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Loader2,
  ChevronDown,
  Filter,
  Clock,
  TrendingUp,
  ArrowUp,
  Sparkles,
  MessageSquare,
  Users,
  ExternalLink,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { SearchResult } from "@/lib/validation";

const popularSearches = [
  "Notion",
  "Shopify",
  "Freelance",
  "Remote work",
  "AI tools",
  "Side hustle",
  "SaaS",
  "Productivity",
];

type SearchResultItem = {
  id: number;
  painTitle: string;
  mentions: number;
  tag: string;
  quotes: Array<{
    text: string;
    upvotes: number;
    author: string;
    permalink?: string;
  }>;
};

export function SearchSection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState("month");
  const [minUpvotes, setMinUpvotes] = useState("10");
  const [sortBy, setSortBy] = useState("relevance");
  const [searchResults, setSearchResults] = useState<SearchResultItem[] | null>(
    null
  );
  const [searchId, setSearchId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = popularSearches.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  );

  /**
   * Progress handling that reflects backend state:
   * - Starts at a small value when a search begins
   * - Increases slightly on each poll while processing
   * - Jumps to 100% when results are completed
   */
  const bumpProgress = useCallback((increment = 5, max = 95) => {
    setLoadingProgress((prev) => {
      if (prev >= max) return prev;
      return Math.min(prev + increment, max);
    });
  }, []);

  /**
   * Transform SearchResult to UI format
   */
  const transformSearchResult = useCallback(
    (result: SearchResult): SearchResultItem[] => {
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
    },
    []
  );

  /**
   * Poll for search results
   */
  const pollSearchStatus = useCallback(
    async (id: string, maxAttempts = 20) => {
      let attempts = 0;

      const poll = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          if (pollingIntervalRef.current) {
            clearTimeout(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsPolling(false);
          setErrorMessage(
            "Search is taking longer than expected. Please refresh the page later."
          );
          setIsLoading(false);
          setLoadingProgress(0);
          return;
        }

        attempts++;

        try {
          // Nudge progress upward while we wait on each successful poll
          bumpProgress(4, 95);

          const response = await fetch(`/api/search-status?searchId=${id}`);

          if (!response.ok) {
            throw new Error("Failed to fetch search status");
          }

          const data = await response.json();

          // Check if we got a full SearchResult
          if (data.status === "completed" && data.painPoints) {
            if (pollingIntervalRef.current) {
              clearTimeout(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setIsPolling(false);
            setIsLoading(false);
            setLoadingProgress(100);

            const transformed = transformSearchResult(data as SearchResult);
            setSearchResults(transformed);
            setVisibleCount(Math.min(5, transformed.length));
            setShowResults(true);

            setTimeout(() => {
              setLoadingProgress(0);
            }, 300);
            return;
          }

          // Check if failed
          if (data.status === "failed") {
            if (pollingIntervalRef.current) {
              clearTimeout(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setIsPolling(false);
            setIsLoading(false);
            setLoadingProgress(0);
            setErrorMessage(
              data.errorMessage || "Search failed. Please try again."
            );
            return;
          }

          // Still processing, poll again
          if (data.status === "processing" || data.status === "pending") {
            const timeoutId = setTimeout(poll, 2000); // Poll every 2 seconds
            pollingIntervalRef.current = timeoutId;
          }
        } catch (error) {
          console.error("Error polling search status:", error);
          if (pollingIntervalRef.current) {
            clearTimeout(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsPolling(false);
          setIsLoading(false);
          setLoadingProgress(0);
          setErrorMessage("Unable to check search status. Please try again.");
        }
      };

      poll();
    },
    [bumpProgress, transformSearchResult]
  );

  /**
   * Cleanup polling on unmount
   */
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
      }
    };
  }, []);

  /**
   * Keep search state in sync with URL params
   * and trigger searches when the URL changes.
   */
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    const urlTags = searchParams.get("tags");
    const urlTime = searchParams.get("time");
    const urlUpvotes = searchParams.get("upvotes");
    const urlSort = searchParams.get("sort");

    // No valid query in URL – reset search state
    if (!urlQuery || urlQuery.length < 2) {
      setQuery(urlQuery || "");
      setShowResults(false);
      setSearchResults(null);
      setErrorMessage(null);
      setIsLoading(false);
      setLoadingProgress(0);
      return;
    }

    // Sync local state with URL
    setQuery(urlQuery);
    setSelectedTags(urlTags ? urlTags.split(",").filter(Boolean) : []);
    if (urlTime) setTimeRange(urlTime);
    if (urlUpvotes) setMinUpvotes(urlUpvotes);
    if (urlSort) setSortBy(urlSort);

    // Clear any existing polling when URL-driven search changes
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    setSearchId(null);

    let cancelled = false;

    const performSearchFromUrl = async () => {
      setIsLoading(true);
      setShowResults(false);
      setErrorMessage(null);
      setLoadingProgress(10);

      const searchPayload = {
        topic: urlQuery,
        tags: urlTags ? urlTags.split(",").filter(Boolean) : [],
        timeRange: urlTime || "month",
        minUpvotes: Number(urlUpvotes || "10"),
        sortBy: urlSort || "relevance",
      };

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(searchPayload),
        });

        if (!response.ok) {
          if (cancelled) return;
          const errorData = await response.json().catch(() => null);
          const message =
            errorData?.error || "Something went wrong starting your search.";
          setErrorMessage(message);
          setIsLoading(false);
          setLoadingProgress(0);
          return;
        }

        const data = await response.json();

        if (cancelled) return;

        // Check if we got a full SearchResult (cached or completed quickly)
        if (data.status === "completed" && data.painPoints) {
          setIsLoading(false);
          setLoadingProgress(100);

          const transformed = transformSearchResult(data as SearchResult);
          setSearchResults(transformed);
          setVisibleCount(Math.min(5, transformed.length));
          setShowResults(true);
          setSearchId(data.searchId);

          setTimeout(() => {
            setLoadingProgress(0);
          }, 300);
          return;
        }

        // Otherwise, we got a searchId and status
        const restoredSearchId = data.searchId;
        const status = data.status;

        if (!restoredSearchId) {
          setIsLoading(false);
          setLoadingProgress(0);
          setErrorMessage("Invalid response from server.");
          return;
        }

        setSearchId(restoredSearchId);

        // If processing, start polling
        if (status === "processing" || status === "pending") {
          setIsPolling(true);
          await pollSearchStatus(restoredSearchId);
        } else if (status === "failed") {
          setIsLoading(false);
          setLoadingProgress(0);
          setErrorMessage(
            data.errorMessage || "Search failed. Please try again."
          );
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Error restoring search from URL:", error);
        setErrorMessage("Unable to restore search. Please try again.");
        setIsLoading(false);
        setLoadingProgress(0);
      }
    };

    performSearchFromUrl();

    return () => {
      cancelled = true;
    };
  }, [searchParams, pollSearchStatus, transformSearchResult]);

  const handleSearch = useCallback(async () => {
    if (query.length < 2) return;

    const currentParams = new URLSearchParams();
    currentParams.set("q", query);
    if (selectedTags.length > 0)
      currentParams.set("tags", selectedTags.join(","));
    if (timeRange !== "month") currentParams.set("time", timeRange);
    if (minUpvotes !== "10") currentParams.set("upvotes", minUpvotes);
    if (sortBy !== "relevance") currentParams.set("sort", sortBy);

    const currentUrlParams = currentParams.toString();

    router.push(`?${currentUrlParams}`, { scroll: false });
  }, [query, selectedTags, timeRange, minUpvotes, sortBy, router]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    if (showSuggestions) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showSuggestions]);

  const hnTags = [
    { value: "story", label: "Stories" },
    { value: "ask_hn", label: "Ask HN" },
    { value: "show_hn", label: "Show HN" },
    { value: "front_page", label: "Front Page" },
    { value: "poll", label: "Polls" },
  ];

  const getHNTagLabel = (tag: string): string => {
    if (tag === "hackernews") return "Hacker News";

    const match = hnTags.find((t) => t.value === tag);
    if (match) return match.label;

    // Fallback: prettify unknown tags like "some_tag" -> "Some Tag"
    return tag.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <section className="relative pb-8 lg:pb-10">
      <div className="fixed top-0 left-0 right-0 z-[100] h-1 pointer-events-none">
        <div
          className={cn(
            "h-full transition-all duration-200 ease-out",
            loadingProgress > 0 ? "opacity-100" : "opacity-0"
          )}
          style={{
            width: `${loadingProgress}%`,
            background: "linear-gradient(90deg, #ea580c, #f97316, #fb923c)",
            boxShadow:
              "0 0 10px rgba(234, 88, 12, 0.7), 0 0 20px rgba(234, 88, 12, 0.4)",
          }}
        />
        {loadingProgress > 0 && loadingProgress < 100 && (
          <div
            className="absolute right-0 top-0 h-full w-24 animate-pulse"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.4))",
              transform: `translateX(${loadingProgress < 95 ? "0" : "100%"})`,
            }}
          />
        )}
      </div>

      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        {/* Search Input Card */}
        <div
          className={cn(
            "relative rounded-2xl transition-all duration-500 ease-out overflow-visible",
            isFocused
              ? "shadow-[0_4px_8px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.08),0_32px_64px_rgba(0,0,0,0.06),0_0_0_1px_rgba(234,88,12,0.15)]"
              : "shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.02)]"
          )}
        >
          {/* Gradient border */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-border/50 via-border/30 to-border/50 p-px">
            <div className="absolute inset-px rounded-[15px] bg-card" />
          </div>

          {/* Top highlight */}
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

          <div className="relative flex items-center bg-card rounded-2xl">
            <div className="absolute left-5 flex items-center pointer-events-none">
              {isLoading ? (
                <div className="relative">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <div className="absolute inset-0 blur-sm opacity-50">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                </div>
              ) : (
                <Search
                  className={cn(
                    "w-5 h-5 transition-colors duration-300",
                    isFocused ? "text-primary" : "text-muted-foreground"
                  )}
                />
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => {
                setIsFocused(true);
                if (query.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                  setShowSuggestions(false);
                }
              }}
              placeholder="Enter keyword (e.g., Notion, Shopify, Freelance)"
              className="w-full h-16 lg:h-[72px] pl-14 pr-36 text-base lg:text-lg bg-transparent border-0 outline-none placeholder:text-muted-foreground/50"
            />

            <div className="absolute right-3 flex items-center gap-3">
              <span
                className={cn(
                  "text-xs font-mono px-2 py-1 rounded-md transition-all duration-200",
                  query.length < 2
                    ? "text-muted-foreground bg-transparent"
                    : "text-foreground bg-secondary"
                )}
              >
                {query.length}/50
              </span>
              <Button
                onClick={handleSearch}
                disabled={query.length < 2 || isLoading}
                className={cn(
                  "h-11 px-6 bg-foreground text-background font-medium rounded-xl",
                  "disabled:opacity-50 transition-all duration-300",
                  "hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:-translate-y-0.5",
                  "relative overflow-hidden shimmer-hover",
                  query.length >= 2 && !isLoading && "animate-pulse-glow"
                )}
                style={{
                  boxShadow:
                    query.length >= 2
                      ? "0 4px 12px rgba(0,0,0,0.15)"
                      : undefined,
                }}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    {isPolling ? "Mining..." : "Starting..."}
                  </span>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Options Accordion */}
        <div className="mt-8">
          <Accordion className="w-full">
            <AccordionItem value="options" className="border-0">
              <AccordionTrigger className="group flex items-center gap-2 py-3 px-5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary/50 transition-all duration-300 [&[data-state=open]]:bg-secondary/50 [&[data-state=open]]:shadow-sm cursor-pointer">
                <Filter className="w-4 h-4" />
                <span>Advanced Options</span>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-2">
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.01), rgba(0,0,0,0.02))",
                    boxShadow:
                      "inset 0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)",
                  }}
                >
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                  {/* HN Tag Filter */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-br from-primary to-orange-600 shadow-sm" />
                      Hacker News Tag Filter
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {hnTags.map((tag) => {
                        const isActive = selectedTags.includes(tag.value);
                        return (
                          <button
                            key={tag.value}
                            onClick={() => {
                              setSelectedTags((prev) =>
                                prev.includes(tag.value)
                                  ? prev.filter((s) => s !== tag.value)
                                  : [...prev, tag.value]
                              );
                            }}
                            className={cn(
                              "cursor-pointer px-3.5 py-2 text-xs font-medium rounded-lg transition-all duration-200 relative overflow-hidden",
                              isActive
                                ? "bg-foreground text-background shadow-md"
                                : "bg-card text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border/50 hover:border-border"
                            )}
                            style={
                              isActive
                                ? { boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }
                                : undefined
                            }
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Range */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      Time Range
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "week", label: "Past Week" },
                        { value: "month", label: "Past Month" },
                        { value: "year", label: "Past Year" },
                        { value: "all", label: "All Time" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTimeRange(option.value)}
                          className={cn(
                            "cursor-pointer px-3.5 py-2 text-xs font-medium rounded-lg transition-all duration-200",
                            timeRange === option.value
                              ? "bg-foreground text-background shadow-md"
                              : "bg-card text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border/50 hover:border-border"
                          )}
                          style={
                            timeRange === option.value
                              ? { boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }
                              : undefined
                          }
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Min Upvotes */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <ArrowUp className="w-3.5 h-3.5 text-primary" />
                      Minimum Upvotes
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["0", "10", "50", "100", "500"].map((value) => (
                        <button
                          key={value}
                          onClick={() => setMinUpvotes(value)}
                          className={cn(
                            "cursor-pointer px-3.5 py-2 text-xs font-medium rounded-lg transition-all duration-200",
                            minUpvotes === value
                              ? "bg-foreground text-background shadow-md"
                              : "bg-card text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border/50 hover:border-border"
                          )}
                          style={
                            minUpvotes === value
                              ? { boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }
                              : undefined
                          }
                        >
                          {value === "0" ? "Any" : `${value}+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      Sort By
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "relevance", label: "Relevance" },
                        { value: "upvotes", label: "Upvotes" },
                        { value: "recency", label: "Recency" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSortBy(option.value)}
                          className={cn(
                            "cursor-pointer px-3.5 py-2 text-xs font-medium rounded-lg transition-all duration-200",
                            sortBy === option.value
                              ? "bg-foreground text-background shadow-md"
                              : "bg-card text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border/50 hover:border-border"
                          )}
                          style={
                            sortBy === option.value
                              ? { boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }
                              : undefined
                          }
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Global error message (always visible when present) */}
        {errorMessage && (
          <div className="mt-6 px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/20 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {/* Loading/Processing state (shown while search is in progress) */}
        {isLoading && !errorMessage && (
          <div className="mt-10 text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-lg font-medium">
                {isPolling
                  ? "Mining insights from Hacker News..."
                  : "Starting search..."}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              This may take a few moments while we analyze discussions...
            </p>
          </div>
        )}

        {showResults && searchResults && (
          <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Results header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Pain Points Found</h2>
                  <p className="text-sm text-muted-foreground">
                    {searchResults.length} insights for "{query}"
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>
                  {searchResults
                    .reduce((acc, r) => acc + r.mentions, 0)
                    .toLocaleString()}{" "}
                  total mentions
                </span>
              </div>
            </div>

            {/* Result Cards */}
            <div className="space-y-4">
              {searchResults.slice(0, visibleCount).map((result, index) => (
                <div
                  key={result.id}
                  className="group relative rounded-2xl bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{
                    boxShadow:
                      "0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04), 0 16px 32px rgba(0,0,0,0.02)",
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Card gradient border */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-border/60 via-border/30 to-border/60 p-px pointer-events-none">
                    <div className="absolute inset-px rounded-[15px] bg-card" />
                  </div>

                  {/* Top highlight */}
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                  {/* Hover glow effect */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 0%), rgba(234, 88, 12, 0.03), transparent 40%)",
                    }}
                  />

                  <div className="relative p-6">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex-1 space-y-2">
                        <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors duration-300">
                          {result.painTitle}
                        </h3>
                        <div className="flex items-center gap-3">
                          {/* HN Tag Badge */}
                          <span className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#ff6600]/10 text-[#ff6600] font-medium border border-[#ff6600]/20">
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M0 24V0h24v24H0zM11.97 12.53L7.22 3.64H5.25l5.76 10.75v6.97h2.09v-6.97L18.86 3.64h-1.97l-4.92 8.89z" />
                            </svg>
                            {getHNTagLabel(result.tag)}
                          </span>

                          {/* Mentions count */}
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {result.mentions.toLocaleString()}{" "}
                            {result.mentions === 1 ? "mention" : "mentions"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quotes Section */}
                    <div className="space-y-3">
                      {result.quotes.map((quote, qIndex) => (
                        <div
                          key={qIndex}
                          className={cn(
                            "relative pl-4 py-3 rounded-xl transition-all duration-200",
                            quote.permalink &&
                              !quote.permalink.includes("undefined")
                              ? "hover:bg-secondary/40 cursor-pointer"
                              : "hover:bg-secondary/30"
                          )}
                          style={{
                            background:
                              "linear-gradient(to right, rgba(0,0,0,0.02), transparent)",
                          }}
                        >
                          {/* Quote indicator line */}
                          <div
                            className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                            style={{
                              background:
                                "linear-gradient(to bottom, rgba(234, 88, 12, 0.6), rgba(234, 88, 12, 0.2))",
                            }}
                          />

                          <div className="flex items-start gap-2">
                            <Quote className="w-4 h-4 text-primary/40 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              {quote.permalink &&
                              !quote.permalink.includes("undefined") ? (
                                <a
                                  href={quote.permalink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block group"
                                  title="View on Hacker News"
                                >
                                  <p className="text-sm text-foreground/90 leading-relaxed italic cursor-pointer hover:text-primary transition-colors">
                                    "{quote.text}"
                                  </p>
                                </a>
                              ) : (
                                <p className="text-sm text-foreground/90 leading-relaxed italic">
                                  "{quote.text}"
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                {quote.author ? (
                                  quote.author !== "Anonymous" ? (
                                    <a
                                      href={
                                        quote.permalink &&
                                        !quote.permalink.includes("undefined")
                                          ? quote.permalink
                                          : `https://news.ycombinator.com/user?id=${quote.author}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {quote.author}
                                    </a>
                                  ) : (
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {quote.author}
                                    </span>
                                  )
                                ) : null}
                                {quote.permalink &&
                                  !quote.permalink.includes("undefined") && (
                                    <a
                                      href={quote.permalink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                      title="View on Hacker News"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load more button */}
            {searchResults.length > visibleCount && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  className="px-8 py-3 rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 bg-transparent"
                  onClick={() =>
                    setVisibleCount((prev) =>
                      Math.min(prev + 5, searchResults.length)
                    )
                  }
                >
                  <span className="flex items-center gap-2">
                    Load more results
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
