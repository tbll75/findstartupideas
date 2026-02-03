"use client";

import { cn } from "@/lib/utils";
import { Newspaper, MessageCircle, Sparkles, CheckCircle } from "lucide-react";

interface SearchProgressProps {
  progress: number;
  phase?: "idle" | "stories" | "comments" | "analysis" | "completed" | "failed";
  storiesCount?: number;
  commentsCount?: number;
}

/**
 * Premium top progress bar with phase indicators
 */
export function SearchProgress({
  progress,
  phase = "idle",
}: SearchProgressProps) {
  // Show whenever we have some progress and we're not in a terminal error state
  const isActive = progress > 0 && phase !== "failed";

  const getPhaseLabel = () => {
    switch (phase) {
      case "stories":
        return "Discovering Stories";
      case "comments":
        return "Mining Comments";
      case "analysis":
        return "AI Analysis";
      case "completed":
        return "Complete";
      default:
        return "Searching";
    }
  };

  return (
    <>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-1 pointer-events-none">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out",
            isActive ? "opacity-100" : "opacity-0"
          )}
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #ea580c, #f97316, #fb923c)",
            boxShadow:
              "0 0 10px rgba(234, 88, 12, 0.7), 0 0 20px rgba(234, 88, 12, 0.4)",
          }}
        />
        {isActive && progress < 100 && (
          <div
            className="absolute right-0 top-0 h-full w-24 animate-pulse"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.4))",
              transform: `translateX(${progress < 95 ? "0" : "100%"})`,
            }}
          />
        )}
      </div>
    </>
  );
}
