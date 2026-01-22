"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface SearchLoadingProps {
  isPolling: boolean;
  phase?:
    | "idle"
    | "stories"
    | "comments"
    | "analysis"
    | "completed"
    | "failed";
  storiesCount?: number;
  commentsCount?: number;
}

/**
 * Initial loading state before any data arrives
 * Shows helpful messages based on how long the wait is
 */
export function SearchLoading({
  isPolling,
}: SearchLoadingProps) {
  const [waitTime, setWaitTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWaitTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getMessage = () => {
    if (waitTime < 5) {
      return "Initiating search...";
    } else if (waitTime < 15) {
      return "Connecting to Hacker News...";
    } else if (waitTime < 30) {
      return "Analyzing thousands of discussions...";
    } else {
      return "Almost there, gathering final insights...";
    }
  };

  return (
    <div className="mt-16 mb-12 flex flex-col items-center justify-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Loading icon with glow effect */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center shadow-elevation-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>

      {/* Loading message */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          {getMessage()}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {isPolling 
            ? "This search is taking longer than usual. Please wait..."
            : "Preparing to scan Hacker News for insights..."}
        </p>
      </div>

      {/* Loading dots indicator */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
        <div
          className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>

      {/* Progress message for long waits */}
      {waitTime > 20 && (
        <div className="text-xs text-muted-foreground animate-in fade-in duration-300">
          Large searches can take 30-60 seconds
        </div>
      )}
    </div>
  );
}
