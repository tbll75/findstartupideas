"use client";

import { Filter, Clock, ArrowUp, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HN_TAG_OPTIONS,
  TIME_RANGE_OPTIONS,
  SORT_OPTIONS,
  MIN_UPVOTES_OPTIONS,
} from "./utils/transform-results";

interface SearchFiltersProps {
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  timeRange: string;
  onTimeRangeChange: (timeRange: string) => void;
  minUpvotes: string;
  onMinUpvotesChange: (minUpvotes: string) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
}

/**
 * Filter button component
 */
function FilterButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "cursor-pointer px-3.5 py-2 text-xs font-medium rounded-lg transition-all duration-200",
        isActive
          ? "bg-foreground text-background shadow-md"
          : "bg-card text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border/50 hover:border-border"
      )}
      style={isActive ? { boxShadow: "0 2px 8px rgba(0,0,0,0.15)" } : undefined}
    >
      {children}
    </button>
  );
}

/**
 * Advanced search filters accordion
 */
export function SearchFilters({
  selectedTags,
  onToggleTag,
  timeRange,
  onTimeRangeChange,
  minUpvotes,
  onMinUpvotesChange,
  sortBy,
  onSortByChange,
}: SearchFiltersProps) {
  return (
    <div className="mt-8">
      <Accordion className="w-full">
        <AccordionItem value="options" className="border-0">
          <AccordionTrigger className="group flex items-center gap-2 py-3 px-5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary/50 transition-all duration-300 [&[data-state=open]]:bg-secondary/50 [&[data-state=open]]:shadow-sm cursor-pointer">
            <Filter className="w-4 h-4" />
            <span>Advanced Options</span>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-2">
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.01), rgba(0,0,0,0.02))",
                boxShadow:
                  "inset 0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)",
              }}
            >
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              {/* HN Tag Filter */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-br from-primary to-orange-600 shadow-sm" />
                  Hacker News Tag Filter
                </label>
                <div className="flex flex-wrap gap-2">
                  {HN_TAG_OPTIONS.map((tag) => (
                    <FilterButton
                      key={tag.value}
                      isActive={selectedTags.includes(tag.value)}
                      onClick={() => onToggleTag(tag.value)}
                    >
                      {tag.label}
                    </FilterButton>
                  ))}
                </div>
              </div>

              {/* Time Range */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Time Range
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <FilterButton
                      key={option.value}
                      isActive={timeRange === option.value}
                      onClick={() => onTimeRangeChange(option.value)}
                    >
                      {option.label}
                    </FilterButton>
                  ))}
                </div>
              </div>

              {/* Min Upvotes */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <ArrowUp className="w-3.5 h-3.5 text-primary" />
                  Minimum Upvotes
                </label>
                <div className="flex flex-wrap gap-2">
                  {MIN_UPVOTES_OPTIONS.map((value) => (
                    <FilterButton
                      key={value}
                      isActive={minUpvotes === value}
                      onClick={() => onMinUpvotesChange(value)}
                    >
                      {value === "0" ? "Any" : `${value}+`}
                    </FilterButton>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  Sort By
                </label>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((option) => (
                    <FilterButton
                      key={option.value}
                      isActive={sortBy === option.value}
                      onClick={() => onSortByChange(option.value)}
                    >
                      {option.label}
                    </FilterButton>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
