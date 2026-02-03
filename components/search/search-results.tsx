"use client";

import { useState, useMemo } from "react";
import { Sparkles, Users, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SearchResultItem } from "@/types";
import { PainPointCard } from "./pain-point-card";

interface SearchResultsProps {
  results: SearchResultItem[];
  query: string;
}

/**
 * Search results container with pagination
 */
export function SearchResults({ results, query }: SearchResultsProps) {
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(5, results.length)
  );

  const totalMentions = useMemo(
    () => results.reduce((acc, r) => acc + r.mentions, 0),
    [results]
  );

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 5, results.length));
  };

  return (
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
              {results.length} insights for "{query}"
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{totalMentions.toLocaleString()} total mentions</span>
        </div>
      </div>

      {/* Result Cards */}
      <div className="space-y-4">
        {results.slice(0, visibleCount).map((result, index) => (
          <PainPointCard key={result.id} result={result} index={index} />
        ))}
      </div>

      {/* Load more button */}
      {results.length > visibleCount && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            className="cursor-pointer px-8 py-3 rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 bg-transparent"
            onClick={handleLoadMore}
          >
            <span className="flex items-center gap-2">
              Load more results
              <ChevronDown className="w-4 h-4" />
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
