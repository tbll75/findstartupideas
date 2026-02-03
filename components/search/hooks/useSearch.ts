"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { SearchResult, SearchResultItem, ProductIdea } from "@/types";
import { transformSearchResult } from "../utils/transform-results";
import {
  CLIENT_POLL_INTERVAL_MS,
  CLIENT_MAX_POLL_ATTEMPTS,
} from "@/shared/constants";
import { supabaseBrowserClient } from "@/lib/supabase-browser";

// Types
export interface SearchState {
  isLoading: boolean;
  isPolling: boolean;
  searchId: string | null;
  searchResults: SearchResultItem[] | null;
  errorMessage: string | null;
  loadingProgress: number;
  phase: "idle" | "stories" | "comments" | "analysis" | "completed" | "failed";
  stories: {
    id: string;
    title: string;
    url: string | null;
    points: number;
    tag?: string;
    createdAt?: number;
  }[];
  commentsCount: number;
  comments: {
    id: string;
    snippet: string;
    author?: string;
    upvotes?: number;
    permalink?: string;
  }[];
  painPointsIncremental: SearchResultItem[];
  liveAnalysisSummary?: string | null;
  productIdeas: ProductIdea[];
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

// Hook Implementation
export function useSearch(): SearchState & SearchActions {
  // Core state
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResultItem[] | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Realtime incremental state
  const [phase, setPhase] = useState<SearchState["phase"]>("idle");
  const [stories, setStories] = useState<SearchState["stories"]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [comments, setComments] = useState<SearchState["comments"]>([]);
  const [painPointsIncremental, setPainPointsIncremental] = useState<
    SearchResultItem[]
  >([]);
  const [liveAnalysisSummary, setLiveAnalysisSummary] = useState<string | null>(
    null
  );
  const [productIdeas, setProductIdeas] = useState<ProductIdea[]>([]);

  // Refs for cleanup and deduplication
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeChannelRef = useRef<ReturnType<
    typeof supabaseBrowserClient.channel
  > | null>(null);
  const currentSearchIdRef = useRef<string | null>(null);
  const painPointIndexRef = useRef<Record<string, number>>({});
  const seenStoryIdsRef = useRef<Set<string>>(new Set());
  const seenCommentIdsRef = useRef<Set<string>>(new Set());
  const seenEventIdsRef = useRef<Set<string>>(new Set());
  const isSubscribedRef = useRef(false);

  /**
   * Bump loading progress with bounds checking
   */
  const bumpProgress = useCallback((increment = 5, max = 95) => {
    setLoadingProgress((prev) => {
      if (prev >= max) return prev;
      return Math.min(prev + increment, max);
    });
  }, []);

  /**
   * Clean up any active Supabase Realtime channel
   */
  const cleanupRealtimeChannel = useCallback(() => {
    if (realtimeChannelRef.current) {
      supabaseBrowserClient.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    isSubscribedRef.current = false;
  }, []);

  /**
   * Process a single search event (used by both realtime and backfill)
   */
  const processSearchEvent = useCallback(
    (
      eventId: string,
      evt: {
        phase: "stories" | "comments" | "analysis";
        event_type:
          | "story_discovered"
          | "comment_discovered"
          | "phase_progress";
        payload: any;
      }
    ) => {
      // Skip if we've already processed this event
      if (seenEventIdsRef.current.has(eventId)) {
        return;
      }
      seenEventIdsRef.current.add(eventId);

      // Handle story_discovered events
      if (evt.phase === "stories" && evt.event_type === "story_discovered") {
        const storyId = String(evt.payload.id);

        // Skip duplicate stories
        if (seenStoryIdsRef.current.has(storyId)) {
          return;
        }
        seenStoryIdsRef.current.add(storyId);

        console.log(
          "[Realtime] Story discovered:",
          evt.payload.title?.slice(0, 50)
        );
        setPhase((prev) => (prev === "idle" ? "stories" : prev));
        setStories((prev) => {
          // Double-check for duplicates in state
          if (prev.some((s) => s.id === storyId)) {
            return prev;
          }
          const next = [
            ...prev,
            {
              id: storyId,
              title: evt.payload.title ?? "",
              url: evt.payload.url ?? null,
              points: evt.payload.points ?? 0,
              tag: evt.payload.tag,
              createdAt: evt.payload.createdAt,
            },
          ];
          // Keep first 100 stories
          return next.slice(0, 100);
        });
        bumpProgress(1, 30);
      }

      // Handle comment phase_progress events
      if (evt.phase === "comments" && evt.event_type === "phase_progress") {
        console.log("[Realtime] Comment event received:", {
          totalCommentsSoFar: evt.payload.totalCommentsSoFar,
          commentsInPayload: evt.payload.comments?.length ?? 0,
        });

        setPhase((prev) => {
          const newPhase =
            prev === "idle" || prev === "stories" ? "comments" : prev;
          console.log("[Realtime] Phase transition:", prev, "->", newPhase);
          return newPhase;
        });

        if (typeof evt.payload.totalCommentsSoFar === "number") {
          setCommentsCount(evt.payload.totalCommentsSoFar);
        }

        if (Array.isArray(evt.payload.comments)) {
          setComments((prev) => {
            // Create a Set of existing comment IDs from state for deduplication
            const existingIds = new Set(prev.map((c) => c.id));
            const next = [...prev];
            let addedCount = 0;

            for (const c of evt.payload.comments) {
              if (!c || !c.id) continue;
              const commentId = String(c.id);
              // Deduplicate based on state, not ref (to handle React StrictMode)
              if (existingIds.has(commentId)) continue;
              existingIds.add(commentId);
              addedCount++;
              next.push({
                id: commentId,
                snippet: c.snippet ?? "",
                author: c.author ?? undefined,
                upvotes: typeof c.upvotes === "number" ? c.upvotes : undefined,
                permalink: c.permalink ?? undefined,
              });
            }
            console.log(
              "[Realtime] Added",
              addedCount,
              "new comments, total:",
              next.length
            );
            // Keep latest 100 comments
            return next.slice(-100);
          });
        }
        bumpProgress(1, 70);
      }

      // Handle analysis phase_progress events
      if (evt.phase === "analysis" && evt.event_type === "phase_progress") {
        setPhase("analysis");
        bumpProgress(2, 95);
      }
    },
    [bumpProgress]
  );

  /**
   * Backfill any events that were inserted before we subscribed
   */
  const backfillMissedEvents = useCallback(
    async (id: string) => {
      // Guard against stale search
      if (currentSearchIdRef.current !== id) return;

      try {
        const { data: events, error } = await supabaseBrowserClient
          .from("search_events")
          .select("id, phase, event_type, payload, created_at")
          .eq("search_id", id)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("[Realtime] Failed to fetch backfill events:", error);
          return;
        }

        if (!events || events.length === 0) {
          console.log("[Realtime] No events to backfill");
          return;
        }

        console.log("[Realtime] Backfilling", events.length, "events");

        // Count events by type for debugging
        const eventCounts = events.reduce((acc, e) => {
          const key = `${e.phase}:${e.event_type}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log("[Realtime] Event counts:", eventCounts);

        // Process each event
        for (const event of events) {
          if (currentSearchIdRef.current !== id) break;

          processSearchEvent(event.id, {
            phase: event.phase as "stories" | "comments" | "analysis",
            event_type: event.event_type as
              | "story_discovered"
              | "comment_discovered"
              | "phase_progress",
            payload: event.payload,
          });
        }

        // Also backfill pain_points and quotes if we're in analysis phase
        await backfillPainPointsAndQuotes(id);
      } catch (err) {
        console.error("[Realtime] Backfill error:", err);
      }
    },
    [processSearchEvent]
  );

  /**
   * Populate live feed state from a SearchResult (for cached results)
   */
  const populateLiveFeedFromResult = useCallback((result: SearchResult) => {
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
      quotesByPainPoint.get(quote.painPointId)!.push({
        text: quote.quoteText,
        upvotes: quote.upvotes,
        author: quote.authorHandle || "Anonymous",
        permalink: quote.permalink,
      });
    });

    // Build pain points with quotes
    const incrementalItems: (SearchResultItem & { __painPointId: string })[] =
      [];
    const newPainPointIndex: Record<string, number> = {};

    result.painPoints.forEach((pp, index) => {
      const ppQuotes = quotesByPainPoint.get(pp.id) || [];
      newPainPointIndex[pp.id] = index;

      incrementalItems.push({
        id: index,
        painTitle: pp.title,
        mentions: pp.mentionsCount ?? 0,
        tag: pp.sourceTag,
        quotes: ppQuotes.slice(0, 5),
        __painPointId: pp.id,
      });
    });

    if (incrementalItems.length > 0) {
      painPointIndexRef.current = newPainPointIndex;
      setPainPointsIncremental(incrementalItems);
      setPhase("analysis");
    }

    // Set AI analysis summary if available
    if (result.analysis?.summary) {
      setLiveAnalysisSummary(result.analysis.summary);
    }

    // Set product ideas if available
    if (
      Array.isArray(result.analysis?.productIdeas) &&
      result.analysis.productIdeas.length > 0
    ) {
      setProductIdeas(result.analysis.productIdeas);
    }
  }, []);

  /**
   * Backfill pain points and their quotes
   */
  const backfillPainPointsAndQuotes = useCallback(async (id: string) => {
    if (currentSearchIdRef.current !== id) return;

    try {
      // Fetch pain points
      const { data: painPoints } = await supabaseBrowserClient
        .from("pain_points")
        .select("id, title, subreddit, mentions_count")
        .eq("search_id", id);

      if (!painPoints || painPoints.length === 0) return;

      // Fetch quotes for these pain points
      const painPointIds = painPoints.map((pp) => pp.id);
      const { data: quotes } = await supabaseBrowserClient
        .from("pain_point_quotes")
        .select(
          "id, pain_point_id, quote_text, author_handle, upvotes, permalink"
        )
        .in("pain_point_id", painPointIds);

      // Group quotes by pain point
      const quotesByPainPoint = new Map<string, typeof quotes>();
      for (const quote of quotes || []) {
        const existing = quotesByPainPoint.get(quote.pain_point_id) || [];
        existing.push(quote);
        quotesByPainPoint.set(quote.pain_point_id, existing);
      }

      // Build incremental pain points
      const incrementalItems: (SearchResultItem & { __painPointId: string })[] =
        [];
      const newPainPointIndex: Record<string, number> = {};

      painPoints.forEach((pp, index) => {
        const ppQuotes = quotesByPainPoint.get(pp.id) || [];
        newPainPointIndex[pp.id] = index;

        incrementalItems.push({
          id: index,
          painTitle: pp.title,
          mentions: pp.mentions_count ?? 0,
          tag: pp.subreddit,
          quotes: ppQuotes.slice(0, 5).map((q) => ({
            text: q.quote_text,
            upvotes: q.upvotes,
            author: q.author_handle ?? "Anonymous",
            permalink: q.permalink,
          })),
          __painPointId: pp.id,
        });
      });

      if (incrementalItems.length > 0) {
        painPointIndexRef.current = newPainPointIndex;
        setPainPointsIncremental(incrementalItems);
        setPhase("analysis");
      }

      // Also check for AI analysis (summary and product ideas)
      const { data: analysis } = await supabaseBrowserClient
        .from("ai_analyses")
        .select("summary, product_ideas")
        .eq("search_id", id)
        .maybeSingle();

      if (analysis?.summary) {
        setLiveAnalysisSummary(analysis.summary);
      }
      if (
        Array.isArray(analysis?.product_ideas) &&
        analysis.product_ideas.length > 0
      ) {
        const validIdeas = (analysis.product_ideas as unknown[]).filter(
          (item): item is ProductIdea =>
            item !== null &&
            typeof item === "object" &&
            typeof (item as Record<string, unknown>).title === "string" &&
            typeof (item as Record<string, unknown>).description === "string" &&
            typeof (item as Record<string, unknown>).targetProblem ===
              "string" &&
            typeof (item as Record<string, unknown>).impactScore === "number"
        );
        setProductIdeas(validIdeas);
      }
    } catch (err) {
      console.error("[Realtime] Failed to backfill pain points:", err);
    }
  }, []);

  /**
   * Start Supabase Realtime subscriptions for a given search
   */
  const startRealtimeSubscriptions = useCallback(
    (id: string) => {
      cleanupRealtimeChannel();

      currentSearchIdRef.current = id;
      isSubscribedRef.current = false;

      const channel = supabaseBrowserClient.channel(`search-progress-${id}`, {
        config: {
          broadcast: { self: true },
        },
      });

      // Listen for search_events (stories/comments/analysis progress)
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "search_events",
          filter: `search_id=eq.${id}`,
        },
        (payload) => {
          if (!payload.new || currentSearchIdRef.current !== id) return;

          const event = payload.new as {
            id: string;
            phase: "stories" | "comments" | "analysis";
            event_type:
              | "story_discovered"
              | "comment_discovered"
              | "phase_progress";
            payload: any;
          };

          console.log(
            "[Realtime] Received event:",
            event.phase,
            event.event_type
          );

          processSearchEvent(event.id, {
            phase: event.phase,
            event_type: event.event_type,
            payload: event.payload,
          });
        }
      );

      // Listen for searches status updates
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "searches",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (!payload.new || currentSearchIdRef.current !== id) return;
          const status = (payload.new as { status: string }).status;

          if (status === "completed") {
            setPhase("completed");
            setLoadingProgress(100);
          } else if (status === "failed") {
            setPhase("failed");
          }
        }
      );

      // Listen for pain_points inserts
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pain_points",
          filter: `search_id=eq.${id}`,
        },
        (payload) => {
          if (!payload.new || currentSearchIdRef.current !== id) return;

          const row = payload.new as {
            id: string;
            search_id: string;
            title: string;
            subreddit: string;
            mentions_count: number;
          };

          setPainPointsIncremental((prev) => {
            // Avoid duplicates
            if (prev.some((p) => (p as any).__painPointId === row.id)) {
              return prev;
            }
            const index = prev.length;
            const item: SearchResultItem & { __painPointId: string } = {
              id: index,
              painTitle: row.title,
              mentions: row.mentions_count ?? 0,
              tag: row.subreddit,
              quotes: [],
              __painPointId: row.id,
            };
            painPointIndexRef.current[row.id] = index;
            return [...prev, item];
          });

          setPhase("analysis");
        }
      );

      // Listen for pain_point_quotes inserts (no filter, check client-side)
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pain_point_quotes",
        },
        (payload) => {
          if (!payload.new) return;

          const row = payload.new as {
            id: string;
            pain_point_id: string;
            quote_text: string;
            author_handle: string | null;
            upvotes: number;
            permalink: string;
          };

          const idx = painPointIndexRef.current[row.pain_point_id];
          if (idx === undefined) return;

          const quote = {
            text: row.quote_text,
            upvotes: row.upvotes,
            author: row.author_handle ?? "Anonymous",
            permalink: row.permalink,
          };

          setPainPointsIncremental((prev) => {
            if (!prev[idx]) return prev;
            const next = [...prev];
            const target: any = next[idx];
            const existingQuotes: SearchResultItem["quotes"] = Array.isArray(
              target.quotes
            )
              ? target.quotes
              : [];

            // Avoid duplicates
            if (
              existingQuotes.some(
                (q) => q.text === quote.text && q.author === quote.author
              )
            ) {
              return prev;
            }

            const updatedQuotes = [...existingQuotes, quote].slice(0, 5);
            next[idx] = { ...target, quotes: updatedQuotes };
            return next;
          });
        }
      );

      // Listen for ai_analyses inserts
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ai_analyses",
          filter: `search_id=eq.${id}`,
        },
        (payload) => {
          if (!payload.new || currentSearchIdRef.current !== id) return;
          const row = payload.new as {
            summary: string;
            product_ideas?: unknown[];
          };
          setLiveAnalysisSummary(row.summary);
          if (
            Array.isArray(row.product_ideas) &&
            row.product_ideas.length > 0
          ) {
            const validIdeas = row.product_ideas.filter(
              (item): item is ProductIdea =>
                item !== null &&
                typeof item === "object" &&
                typeof (item as Record<string, unknown>).title === "string" &&
                typeof (item as Record<string, unknown>).description ===
                  "string" &&
                typeof (item as Record<string, unknown>).targetProblem ===
                  "string" &&
                typeof (item as Record<string, unknown>).impactScore ===
                  "number"
            );
            setProductIdeas(validIdeas);
          }
        }
      );

      // Subscribe and handle status
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          isSubscribedRef.current = true;
          // Backfill any events we might have missed
          backfillMissedEvents(id);
          bumpProgress(2, 20);
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          console.error("[Realtime] Channel error:", status);
          isSubscribedRef.current = false;
        }
      });

      realtimeChannelRef.current = channel;
    },
    [
      bumpProgress,
      cleanupRealtimeChannel,
      processSearchEvent,
      backfillMissedEvents,
    ]
  );

  /**
   * Poll for search results (fallback mechanism)
   */
  const pollSearchStatus = useCallback(
    async (id: string, maxAttempts = CLIENT_MAX_POLL_ATTEMPTS) => {
      let attempts = 0;

      const poll = async (): Promise<void> => {
        // Guard against stale search
        if (currentSearchIdRef.current !== id) return;

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
          setPhase("failed");
          return;
        }

        attempts++;

        try {
          bumpProgress(3, 95);

          const response = await fetch(`/api/search-status?searchId=${id}`);

          if (!response.ok) {
            throw new Error("Failed to fetch search status");
          }

          const data = await response.json();

          // Check if completed with full result
          if (data.status === "completed" && data.painPoints) {
            if (pollingIntervalRef.current) {
              clearTimeout(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setIsPolling(false);
            setIsLoading(false);
            setLoadingProgress(100);
            setPhase("completed");

            const transformed = transformSearchResult(data as SearchResult);
            setSearchResults(transformed);

            // Populate live feed state from result (keep live feeds visible)
            populateLiveFeedFromResult(data as SearchResult);

            setTimeout(() => setLoadingProgress(0), 300);
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
            setPhase("failed");
            return;
          }

          // Still processing, poll again
          if (data.status === "processing" || data.status === "pending") {
            pollingIntervalRef.current = setTimeout(
              poll,
              CLIENT_POLL_INTERVAL_MS
            );
          }
        } catch (error) {
          console.error("Error polling search status:", error);
          // Don't fail immediately on network error, retry
          if (attempts < maxAttempts) {
            pollingIntervalRef.current = setTimeout(
              poll,
              CLIENT_POLL_INTERVAL_MS
            );
          } else {
            if (pollingIntervalRef.current) {
              clearTimeout(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setIsPolling(false);
            setIsLoading(false);
            setLoadingProgress(0);
            setErrorMessage("Unable to check search status. Please try again.");
          }
        }
      };

      poll();
    },
    [bumpProgress]
  );

  /**
   * Clear all incremental state
   */
  const clearIncrementalState = useCallback(() => {
    setStories([]);
    setCommentsCount(0);
    setComments([]);
    setPainPointsIncremental([]);
    setLiveAnalysisSummary(null);
    setProductIdeas([]);
    painPointIndexRef.current = {};
    seenStoryIdsRef.current = new Set();
    seenCommentIdsRef.current = new Set();
    seenEventIdsRef.current = new Set();
  }, []);

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

      // Reset state
      setIsLoading(true);
      setIsPolling(false);
      setSearchId(null);
      setSearchResults(null);
      setErrorMessage(null);
      setLoadingProgress(10);
      setPhase("idle");
      clearIncrementalState();
      cleanupRealtimeChannel();

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

        // Cache hit - completed immediately
        if (data.status === "completed" && data.painPoints) {
          setIsLoading(false);
          setLoadingProgress(100);
          setPhase("completed");

          const transformed = transformSearchResult(data as SearchResult);
          setSearchResults(transformed);
          setSearchId(data.searchId);
          currentSearchIdRef.current = data.searchId;

          // Populate live feed state from cached result
          populateLiveFeedFromResult(data as SearchResult);

          setTimeout(() => setLoadingProgress(0), 300);
          return;
        }

        // Got a searchId, need to wait for processing
        const restoredSearchId = data.searchId;
        const status = data.status;

        if (!restoredSearchId) {
          setIsLoading(false);
          setLoadingProgress(0);
          setErrorMessage("Invalid response from server.");
          return;
        }

        setSearchId(restoredSearchId);
        currentSearchIdRef.current = restoredSearchId;

        // Start realtime subscriptions for incremental updates
        startRealtimeSubscriptions(restoredSearchId);

        // Start polling as fallback
        if (status === "processing" || status === "pending") {
          setIsPolling(true);
          pollSearchStatus(restoredSearchId);
        } else if (status === "failed") {
          setIsLoading(false);
          setLoadingProgress(0);
          setErrorMessage(
            data.errorMessage || "Search failed. Please try again."
          );
          setPhase("failed");
        }
      } catch (error) {
        console.error("Error performing search:", error);
        setErrorMessage("Unable to perform search. Please try again.");
        setIsLoading(false);
        setLoadingProgress(0);
        setPhase("failed");
      }
    },
    [
      pollSearchStatus,
      startRealtimeSubscriptions,
      cleanupRealtimeChannel,
      clearIncrementalState,
    ]
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
    setPhase("idle");
    clearIncrementalState();
    currentSearchIdRef.current = null;
    cleanupRealtimeChannel();
  }, [cleanupRealtimeChannel, clearIncrementalState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
      }
      cleanupRealtimeChannel();
    };
  }, [cleanupRealtimeChannel]);

  return {
    isLoading,
    isPolling,
    searchId,
    searchResults,
    errorMessage,
    loadingProgress,
    phase,
    stories,
    commentsCount,
    comments,
    painPointsIncremental,
    liveAnalysisSummary,
    productIdeas,
    performSearch,
    resetSearch,
    bumpProgress,
  };
}
