"use client";

import { useRef, useState, useEffect } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { popularSearches } from "@/constants";

interface SearchInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  isPolling: boolean;
}

/**
 * Search input with suggestions dropdown
 */
export function SearchInput({
  query,
  onQueryChange,
  onSearch,
  isLoading,
  isPolling,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = popularSearches.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  );

  const handleSuggestionClick = (suggestion: string) => {
    onQueryChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    if (showSuggestions) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showSuggestions]);

  return (
    <div
      className={cn(
        "relative rounded-2xl transition-all duration-500 ease-out overflow-visible",
        isFocused
          ? "shadow-[0_4px_8px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.08),0_32px_64px_rgba(0,0,0,0.06),0_0_0_1px_rgba(234,88,12,0.15)]"
          : "shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.02)]"
      )}
    >
      {/* Gradient border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-border/50 via-border/30 to-border/50 p-px">
        <div className="absolute inset-px rounded-[15px] bg-card" />
      </div>

      {/* Top highlight */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

      <div className="relative flex items-center bg-card rounded-2xl">
        <div className="absolute left-5 flex items-center pointer-events-none">
          {isLoading ? (
            <div className="relative">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <div className="absolute inset-0 blur-sm opacity-50">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            </div>
          ) : (
            <Search
              className={cn(
                "w-5 h-5 transition-colors duration-300",
                isFocused ? "text-primary" : "text-muted-foreground"
              )}
            />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onFocus={() => {
            setIsFocused(true);
            if (query.length > 0) setShowSuggestions(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch();
              setShowSuggestions(false);
            }
          }}
          placeholder="Enter keyword (e.g., AI Videos, Remote Jobs, Next.js)"
          className="w-full h-16 lg:h-[72px] pl-14 pr-36 text-base lg:text-lg bg-transparent border-0 outline-none placeholder:text-muted-foreground/50"
        />

        <div className="absolute right-3 flex items-center gap-3">
          <span
            className={cn(
              "text-xs font-mono px-2 py-1 rounded-md transition-all duration-200",
              query.length < 2
                ? "text-muted-foreground bg-transparent"
                : "text-foreground bg-secondary"
            )}
          >
            {query.length}/50
          </span>
          <Button
            onClick={onSearch}
            disabled={query.length < 2 || isLoading}
            className={cn(
              "cursor-pointer h-11 px-6 bg-foreground text-background font-medium rounded-xl",
              "disabled:opacity-50 transition-all duration-300",
              "hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:-translate-y-0.5",
              "relative overflow-hidden shimmer-hover",
              query.length >= 2 && !isLoading && "animate-pulse-glow"
            )}
            style={{
              boxShadow:
                query.length >= 2 ? "0 4px 12px rgba(0,0,0,0.15)" : undefined,
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse" />
                {isPolling ? "Mining..." : "Starting..."}
              </span>
            ) : (
              "Search"
            )}
          </Button>
        </div>
      </div>

      {/* Suggestions dropdown */}
      {/* {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-border shadow-lg z-50">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-secondary/50 first:rounded-t-xl last:rounded-b-xl transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )} */}
    </div>
  );
}
