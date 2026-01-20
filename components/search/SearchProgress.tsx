"use client";

import { cn } from "@/lib/utils";

interface SearchProgressProps {
  progress: number;
}

/**
 * Top progress bar for search loading state
 */
export function SearchProgress({ progress }: SearchProgressProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 pointer-events-none">
      <div
        className={cn(
          "h-full transition-all duration-200 ease-out",
          progress > 0 ? "opacity-100" : "opacity-0"
        )}
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #ea580c, #f97316, #fb923c)",
          boxShadow:
            "0 0 10px rgba(234, 88, 12, 0.7), 0 0 20px rgba(234, 88, 12, 0.4)",
        }}
      />
      {progress > 0 && progress < 100 && (
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
  );
}
