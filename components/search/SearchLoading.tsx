"use client";

import { Loader2 } from "lucide-react";

interface SearchLoadingProps {
  isPolling: boolean;
}

/**
 * Loading state display
 */
export function SearchLoading({ isPolling }: SearchLoadingProps) {
  return (
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
  );
}
