"use client";

import { memo } from "react";
import { MessageSquare } from "lucide-react";
import type { SearchResultItem } from "@/types";
import { QuoteItem } from "./QuoteItem";
import { getHNTagLabel } from "./utils/transform-results";

interface PainPointCardProps {
  result: SearchResultItem;
  index: number;
}

/**
 * Pain point result card with quotes
 * Memoized for performance
 */
export const PainPointCard = memo(function PainPointCard({
  result,
  index,
}: PainPointCardProps) {
  return (
    <div
      className="group relative rounded-2xl bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        boxShadow:
          "0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04), 0 16px 32px rgba(0,0,0,0.02)",
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Card gradient border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-border/60 via-border/30 to-border/60 p-px pointer-events-none">
        <div className="absolute inset-px rounded-[15px] bg-card" />
      </div>

      {/* Top highlight */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 0%), rgba(234, 88, 12, 0.03), transparent 40%)",
        }}
      />

      <div className="relative p-6">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1 space-y-2">
            <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors duration-300">
              {result.painTitle}
            </h3>
            <div className="flex items-center gap-3">
              {/* HN Tag Badge */}
              <span className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#ff6600]/10 text-[#ff6600] font-medium border border-[#ff6600]/20">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M0 24V0h24v24H0zM11.97 12.53L7.22 3.64H5.25l5.76 10.75v6.97h2.09v-6.97L18.86 3.64h-1.97l-4.92 8.89z" />
                </svg>
                {getHNTagLabel(result.tag)}
              </span>

              {/* Mentions count */}
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="w-3.5 h-3.5" />
                {result.mentions.toLocaleString()}{" "}
                {result.mentions === 1 ? "mention" : "mentions"}
              </span>
            </div>
          </div>
        </div>

        {/* Quotes Section */}
        <div className="space-y-3">
          {result.quotes.map((quote, qIndex) => (
            <QuoteItem key={qIndex} quote={quote} />
          ))}
        </div>
      </div>
    </div>
  );
});
