"use client";

import { popularSearches } from "@/constants";
import { ArrowBigRightDash, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExampleSearchBadgesProps {
  onSelect: (searchTerm: string) => void;
}

/**
 * Premium example search badges component
 * Displays popular search terms as clickable badges
 */
export function ExampleSearchBadges({ onSelect }: ExampleSearchBadgesProps) {
  // Gradient colors for each badge (cycling through a premium palette)
  const badgeGradients = [
    "from-blue-500/10 via-cyan-500/8 to-blue-500/10",
    "from-emerald-500/10 via-teal-500/8 to-emerald-500/10",
    "from-violet-500/10 via-purple-500/8 to-violet-500/10",
    "from-rose-500/10 via-pink-500/8 to-rose-500/10",
    "from-indigo-500/10 via-blue-500/8 to-indigo-500/10",
    "from-amber-500/10 via-yellow-500/8 to-amber-500/10",
    "from-teal-500/10 via-emerald-500/8 to-teal-500/10",
  ];

  const badgeBorders = [
    "border-blue-500/20",
    "border-emerald-500/20",
    "border-violet-500/20",
    "border-rose-500/20",
    "border-indigo-500/20",
    "border-amber-500/20",
    "border-teal-500/20",
  ];

  const badgeHoverBorders = [
    "hover:border-blue-500/40",
    "hover:border-emerald-500/40",
    "hover:border-violet-500/40",
    "hover:border-rose-500/40",
    "hover:border-indigo-500/40",
    "hover:border-amber-500/40",
    "hover:border-teal-500/40",
  ];

  const badgeTextColors = [
    "text-blue-600 dark:text-blue-400",
    "text-emerald-600 dark:text-emerald-400",
    "text-violet-600 dark:text-violet-400",
    "text-rose-600 dark:text-rose-400",
    "text-indigo-600 dark:text-indigo-400",
    "text-amber-600 dark:text-amber-400",
    "text-teal-600 dark:text-teal-400",
  ];

  return (
    <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-3 px-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-muted-foreground/60" />
          <p className="text-sm font-medium text-muted-foreground/80">
            Try searching for:
          </p>
        </div>

         <div className="flex flex-wrap gap-2.5">
        {popularSearches.map((search, index) => {
          const gradientIndex = index % badgeGradients.length;
          return (
            <button
              key={search}
              onClick={() => onSelect(search)}
              className={cn(
                "group relative px-3 py-1 rounded-xl",
                "bg-gradient-to-br",
                badgeGradients[gradientIndex],
                "border border-solid",
                badgeBorders[gradientIndex],
                badgeHoverBorders[gradientIndex],
                "backdrop-blur-sm",
                "transition-all duration-300 ease-out",
                "hover:scale-105 hover:shadow-lg",
                "active:scale-100",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background",
                // Premium shadow effects
                "shadow-[0_1px_2px_rgba(0,0,0,0.02),0_2px_4px_rgba(0,0,0,0.02)]",
                "hover:shadow-[0_4px_8px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.03)]",
                // Smooth text transition
                badgeTextColors[gradientIndex],
                "font-medium text-sm",
                "hover:font-semibold"
              )}
            >
              {/* Subtle glow effect on hover */}
              <div
                className={cn(
                  "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100",
                  "bg-gradient-to-br transition-opacity duration-300",
                  badgeGradients[gradientIndex]
                )}
              />
              
              {/* Content */}
              <span className="relative z-10 flex items-center gap-1.5">
                {search}
                {/* <svg
                  className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-1 group-hover:translate-x-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg> */}
                <ArrowBigRightDash className="w-3.5 h-3.5 group-hover:opacity-100 transition-opacity duration-300 -translate-x-1 group-hover:translate-x-0" />
              </span>

              {/* Top highlight shimmer */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-xl" />
            </button>
          );
        })}
      </div>
      </div>
      
     
    </div>
  );
}
