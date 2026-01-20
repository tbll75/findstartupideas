"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { SearchResult, SearchResultItem } from "@/types";
import { transformSearchResult } from "../utils/transform-results";
import { CLIENT_POLL_INTERVAL_MS, CLIENT_MAX_POLL_ATTEMPTS } from "@/shared/constants";

export interface SearchState {
  isLoading: boolean;
  isPolling: boolean;
  searchId: string | null;
  searchResults: SearchResultItem[] | null;
  errorMessage: string | null;
  loadingProgress: number;
}

export interface SearchActions {
  performSearch: (params: SearchParams) => Promise<void>;
  resetSearch: () => void;
  bumpProgress: (increment?: number, max?: number) => void;
}

export interface SearchParams {
  topic: string;
  tags: string[];
  timeRange: string;
  minUpvotes: number;
  sortBy: string;
}

export function useSearch(): SearchState & SearchActions {
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResultItem[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Bump loading progress
   */
  const bumpProgress = useCallback((increment = 5, max = 95) => {
    setLoadingProgress((prev) => {
      if (prev >= max) return prev;
      return Math.min(prev + increment, max);
    });
  }, []);

  /**
   * Poll for search results
   */
  const pollSearchStatus = useCallback(
    async (id: string, maxAttempts = CLIENT_MAX_POLL_ATTEMPTS) => {
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
            const timeoutId = setTimeout(poll, CLIENT_POLL_INTERVAL_MS);
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
    [bumpProgress]
  );

  /**
   * Perform a search
   */
  const performSearch = useCallback(
    async (params: SearchParams) => {
      // Clear any existing polling
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      setIsLoading(true);
      setIsPolling(false);
      setSearchId(null);
      setSearchResults(null);
      setErrorMessage(null);
      setLoadingProgress(10);

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const message =
            errorData?.error || "Something went wrong starting your search.";
          setErrorMessage(message);
          setIsLoading(false);
          setLoadingProgress(0);
          return;
        }

        const data = await response.json();

        // Check if we got a full SearchResult (cached or completed quickly)
        if (data.status === "completed" && data.painPoints) {
          setIsLoading(false);
          setLoadingProgress(100);

          const transformed = transformSearchResult(data as SearchResult);
          setSearchResults(transformed);
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
        console.error("Error performing search:", error);
        setErrorMessage("Unable to perform search. Please try again.");
        setIsLoading(false);
        setLoadingProgress(0);
      }
    },
    [pollSearchStatus]
  );

  /**
   * Reset search state
   */
  const resetSearch = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsLoading(false);
    setIsPolling(false);
    setSearchId(null);
    setSearchResults(null);
    setErrorMessage(null);
    setLoadingProgress(0);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    isPolling,
    searchId,
    searchResults,
    errorMessage,
    loadingProgress,
    performSearch,
    resetSearch,
    bumpProgress,
  };
}
