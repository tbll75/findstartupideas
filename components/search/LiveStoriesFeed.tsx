"use client";

import { useEffect, useRef, useMemo } from "react";
import { Newspaper, ExternalLink, TrendingUp, Clock } from "lucide-react";

interface Story {
  id: string;
  title: string;
  url: string | null;
  points: number;
  tag?: string;
  createdAt?: number;
}

interface LiveStoriesFeedProps {
  stories: Story[];
  phase: string;
}

/**
 * Premium live stories feed that displays stories as they're discovered
 * Uses CSS animations for smooth staggered appearance
 */
export function LiveStoriesFeed({ stories, phase }: LiveStoriesFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevStoriesCountRef = useRef(0);

  // Track when new stories arrive for animation purposes
  useEffect(() => {
    prevStoriesCountRef.current = stories.length;
  }, [stories.length]);

  // Display first 10 stories
  const displayStories = useMemo(() => stories.slice(0, 10), [stories]);

  // Don't render if no stories or in idle phase
  if (!stories.length || phase === "idle") return null;

  return (
    <div ref={containerRef} className="mt-10 space-y-6">
      {/* Header Section */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center shadow-elevation-2">
                <Newspaper className="w-6 h-6 text-primary" />
              </div>
              {phase === "stories" && (
                <div className="absolute -top-1 -right-1 w-3 h-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Discovering Stories
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Found{" "}
                <span className="text-primary font-semibold tabular-nums">
                  {stories.length}
                </span>{" "}
                relevant discussions
              </p>
            </div>
          </div>

          {phase === "stories" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">Live</span>
            </div>
          )}
        </div>

        {/* Progress indicator line */}
        <div className="absolute -bottom-3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 gap-3">
        {displayStories.map((story, index) => (
          <StoryCard key={story.id} story={story} index={index} />
        ))}
      </div>

      {/* Show more indicator if there are more stories */}
      {stories.length > displayStories.length && (
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
            <span>+{stories.length - displayStories.length} more stories</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual story card with animation
 */
function StoryCard({ story, index }: { story: Story; index: number }) {
  return (
    <div
      className="group relative animate-reveal-up"
      style={{
        animationDelay: `${Math.min(index * 50, 500)}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div className="relative rounded-xl border border-border/60 bg-card hover:bg-card/80 transition-all duration-300 hover:border-primary/30 hover:shadow-elevation-2 overflow-hidden">
        {/* Hover gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative p-4">
          <div className="flex items-start gap-3">
            {/* Story number badge */}
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary tabular-nums">
                #{index + 1}
              </span>
            </div>

            {/* Story content */}
            <div className="flex-1 min-w-0 space-y-2">
              <h3 className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {story.title}
              </h3>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {/* Points */}
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="font-medium tabular-nums">{story.points}</span>
                </div>

                {/* Tag */}
                {story.tag && (
                  <span className="px-2 py-0.5 rounded-md bg-[#ff6600]/10 text-[#ff6600] border border-[#ff6600]/20 font-medium">
                    {story.tag}
                  </span>
                )}

                {/* Time ago (if available) */}
                {story.createdAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTimeAgo(story.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Link icon */}
            {story.url && (
              <a
                href={story.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary/50 hover:bg-primary/10 flex items-center justify-center transition-colors group/link"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover/link:text-primary transition-colors" />
              </a>
            )}
          </div>
        </div>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  // Handle both seconds and milliseconds timestamps
  const ts = timestamp > 1e12 ? timestamp : timestamp * 1000;
  const now = Date.now();
  const diff = (now - ts) / 1000;

  if (diff < 60) {
    return "just now";
  } else if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `${mins}m ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diff / 86400);
    return `${days}d ago`;
  }
}
