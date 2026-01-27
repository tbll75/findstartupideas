"use client";

import { cn } from "@/lib/utils";
import { Newspaper, MessageCircle, Sparkles, CheckCircle } from "lucide-react";

interface SearchProgressProps {
  progress: number;
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

  const getPhaseIcon = () => {
    switch (phase) {
      case "stories":
        return <Newspaper className="w-3.5 h-3.5" />;
      case "comments":
        return <MessageCircle className="w-3.5 h-3.5" />;
      case "analysis":
        return <Sparkles className="w-3.5 h-3.5" />;
      case "completed":
        return <CheckCircle className="w-3.5 h-3.5" />;
      default:
        return null;
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

      {/* Phase indicator badge */}
      {/* {isActive && progress < 100 && phase !== "idle" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/95 backdrop-blur-sm border border-border/60 shadow-elevation-2">
            <div className="text-primary">{getPhaseIcon()}</div>
            <span className="text-xs font-medium text-foreground">
              {getPhaseLabel()}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      )} */}
    </>
  );
}