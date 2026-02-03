"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// Constants
const STORAGE_KEY_SEARCH_COUNT = "fsi_search_count";
const STORAGE_KEY_SUBSCRIBED = "fsi_subscribed";
const FREE_SEARCH_LIMIT = 3;

export interface SearchGateState {
  /** Current number of searches performed */
  searchCount: number;
  /** Whether user has subscribed (provided email) */
  isSubscribed: boolean;
  /** Whether user has reached the free search limit */
  hasReachedLimit: boolean;
  /** Whether the gate modal should be shown */
  shouldShowGate: boolean;
  /** Whether the hook has loaded data from localStorage */
  isHydrated: boolean;
}

export interface SearchGateActions {
  /** Increment search count (call before each search) */
  incrementSearchCount: () => void;
  /** Mark user as subscribed (call after successful email submission) */
  markAsSubscribed: () => void;
  /** Check if user can perform a search */
  canSearch: () => boolean;
  /** Open the gate modal */
  openGate: () => void;
  /** Close the gate modal */
  closeGate: () => void;
}

/**
 * Hook for managing search gate (email wall after N free searches)
 *
 * Features:
 * - Tracks search count in localStorage
 * - Persists subscription status
 * - Provides gate modal state management
 */
export function useSearchGate(): SearchGateState & SearchGateActions {
  const [searchCount, setSearchCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [shouldShowGate, setShouldShowGate] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Use refs to always have current values for canSearch
  const searchCountRef = useRef(searchCount);
  const isSubscribedRef = useRef(isSubscribed);

  // Keep refs in sync with state
  useEffect(() => {
    searchCountRef.current = searchCount;
  }, [searchCount]);

  useEffect(() => {
    isSubscribedRef.current = isSubscribed;
  }, [isSubscribed]);

  // Load state from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const storedCount = localStorage.getItem(STORAGE_KEY_SEARCH_COUNT);
      const storedSubscribed = localStorage.getItem(STORAGE_KEY_SUBSCRIBED);

      if (storedCount) {
        const count = parseInt(storedCount, 10);
        if (!isNaN(count) && count >= 0) {
          setSearchCount(count);
          searchCountRef.current = count;
        }
      }

      if (storedSubscribed === "true") {
        setIsSubscribed(true);
        isSubscribedRef.current = true;
      }
    } catch (err) {
      // localStorage not available (e.g., private browsing)
      console.warn("localStorage not available:", err);
    }

    setIsHydrated(true);
  }, []);

  // Persist search count to localStorage
  const persistSearchCount = useCallback((count: number) => {
    try {
      localStorage.setItem(STORAGE_KEY_SEARCH_COUNT, count.toString());
    } catch (err) {
      console.warn("Failed to persist search count:", err);
    }
  }, []);

  // Persist subscription status to localStorage
  const persistSubscribed = useCallback((subscribed: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBSCRIBED, subscribed.toString());
    } catch (err) {
      console.warn("Failed to persist subscription status:", err);
    }
  }, []);

  /**
   * Check if user has reached the free search limit
   */
  const hasReachedLimit = !isSubscribed && searchCount >= FREE_SEARCH_LIMIT;

  /**
   * Check if user can perform a search
   * Uses refs to always get current values
   */
  const canSearch = useCallback((): boolean => {
    // Subscribed users have unlimited searches
    if (isSubscribedRef.current) return true;
    // Non-subscribed users have limited searches
    return searchCountRef.current < FREE_SEARCH_LIMIT;
  }, []);

  /**
   * Increment search count
   */
  const incrementSearchCount = useCallback(() => {
    // Don't increment if already subscribed
    if (isSubscribedRef.current) return;

    setSearchCount((prev) => {
      const newCount = prev + 1;
      searchCountRef.current = newCount;
      persistSearchCount(newCount);
      return newCount;
    });
  }, [persistSearchCount]);

  /**
   * Mark user as subscribed
   */
  const markAsSubscribed = useCallback(() => {
    setIsSubscribed(true);
    isSubscribedRef.current = true;
    persistSubscribed(true);
    setShouldShowGate(false);
  }, [persistSubscribed]);

  /**
   * Open the gate modal
   */
  const openGate = useCallback(() => {
    setShouldShowGate(true);
  }, []);

  /**
   * Close the gate modal
   */
  const closeGate = useCallback(() => {
    // Only allow closing if not at limit (use ref for current value)
    if (isSubscribedRef.current || searchCountRef.current < FREE_SEARCH_LIMIT) {
      setShouldShowGate(false);
    }
  }, []);

  return {
    searchCount,
    isSubscribed,
    hasReachedLimit,
    shouldShowGate,
    isHydrated,
    incrementSearchCount,
    markAsSubscribed,
    canSearch,
    openGate,
    closeGate,
  };
}

/**
 * Export constants for use in other parts of the app
 */
export const SEARCH_GATE_CONFIG = {
  FREE_SEARCH_LIMIT,
  STORAGE_KEY_SEARCH_COUNT,
  STORAGE_KEY_SUBSCRIBED,
} as const;
