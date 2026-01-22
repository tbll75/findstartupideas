"use client";

import { useMemo, useState, useCallback } from "react";
import { Sparkles, TrendingUp, Quote, User, ArrowBigUp, ExternalLink, Share2 } from "lucide-react";
import type { SearchResultItem } from "@/types";
import { getHNTagLabel } from "./utils/transform-results";
import { ShareToolbar } from "./ShareToolbar";
import { ShareModal } from "./ShareModal";

interface LivePainPointsFeedProps {
  painPoints: SearchResultItem[];
  phase: string;
  liveAnalysisSummary?: string | null;
  topic?: string;
}

/**
 * Premium live pain points feed showing AI analysis in real-time
 * Pain points and quotes stream in as they're generated
 */
export function LivePainPointsFeed({
  painPoints,
  phase,
  liveAnalysisSummary,
  topic = "",
}: LivePainPointsFeedProps) {
  // Memoize pain points to prevent unnecessary re-renders
  const displayPainPoints = useMemo(() => painPoints, [painPoints]);

  // State for individual pain point sharing
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedPainPointIndex, setSelectedPainPointIndex] = useState<number | undefined>(undefined);

  // Handle individual pain point share
  const handleSharePainPoint = useCallback((index: number) => {
    setSelectedPainPointIndex(index);
    setShareModalOpen(true);
  }, []);

  // Don't render if no pain points and not in analysis phase
  if (!painPoints.length && phase !== "analysis") return null;

  // Show share toolbar when we have pain points (completed or analysis phase with data)
  const showShareToolbar = painPoints.length > 0 && (phase === "completed" || phase === "analysis");

  return (
    <div className="mt-8 space-y-6">
      {/* Header Section */}
      <div className="relative">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-purple-500/5 flex items-center justify-center shadow-elevation-2">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              {phase === "analysis" && (
                <div className="absolute -top-1 -right-1 w-3 h-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-purple-600 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-600" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">AI Analysis</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Identified{" "}
                <span className="text-purple-600 dark:text-purple-400 font-semibold tabular-nums">
                  {painPoints.length}
                </span>{" "}
                pain points with evidence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Share Toolbar */}
            {showShareToolbar && (
              <ShareToolbar
                topic={topic}
                painPoints={painPoints}
                summary={liveAnalysisSummary}
              />
            )}

            {phase === "analysis" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                  Analyzing
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress indicator line */}
        <div className="absolute -bottom-3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Live Analysis Summary */}
      {liveAnalysisSummary && (
        <div className="relative rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10 p-5 overflow-hidden animate-reveal-scale">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                AI Summary
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {liveAnalysisSummary}
            </p>
          </div>
        </div>
      )}

      {/* Pain Points Feed */}
      {displayPainPoints.length > 0 && (
        <div className="space-y-4">
          {displayPainPoints.map((painPoint, index) => (
            <PainPointItem
              key={`${(painPoint as any).__painPointId || painPoint.id}-${index}`}
              painPoint={painPoint}
              index={index}
              onShare={() => handleSharePainPoint(index)}
              showShareButton={phase === "completed" || phase === "analysis"}
            />
          ))}
        </div>
      )}

      {/* Processing indicator when no pain points visible yet */}
      {displayPainPoints.length === 0 && phase === "analysis" && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 border border-border/60">
            <div className="flex gap-1.5">
              <div
                className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              Clustering pain points...
            </span>
          </div>
        </div>
      )}

      {/* Individual Pain Point Share Modal */}
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        topic={topic}
        painPoints={painPoints}
        summary={liveAnalysisSummary}
        selectedPainPointIndex={selectedPainPointIndex}
        mode="screenshot"
      />
    </div>
  );
}

/**
 * Individual pain point card with quotes
 */
function PainPointItem({
  painPoint,
  index,
  onShare,
  showShareButton,
}: {
  painPoint: SearchResultItem;
  index: number;
  onShare: () => void;
  showShareButton: boolean;
}) {
  return (
    <div
      className="group relative animate-reveal-up"
      style={{
        animationDelay: `${Math.min(index * 100, 400)}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div className="relative rounded-2xl bg-card border border-border/60 overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-elevation-3 hover:-translate-y-0.5">
        {/* Top gradient border */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />

        <div className="relative p-6">
          {/* Pain Point Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary tabular-nums">
                    #{index + 1}
                  </span>
                </div>
                <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                  {painPoint.painTitle}
                </h3>
              </div>

              <div className="flex items-center gap-3 ml-11">
                {/* HN Tag Badge */}
                <span className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ff6600]/10 text-[#ff6600] font-medium border border-[#ff6600]/20">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 24V0h24v24H0zM11.97 12.53L7.22 3.64H5.25l5.76 10.75v6.97h2.09v-6.97L18.86 3.64h-1.97l-4.92 8.89z" />
                  </svg>
                  {getHNTagLabel(painPoint.tag)}
                </span>

                {/* Mentions count */}
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="font-semibold tabular-nums">{painPoint.mentions}</span>{" "}
                  {painPoint.mentions === 1 ? "mention" : "mentions"}
                </span>
              </div>
            </div>

            {/* Share Button */}
            {showShareButton && (
              <button
                onClick={onShare}
                className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                title="Share this pain point"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quotes Section */}
          {painPoint.quotes.length > 0 && (
            <div className="space-y-3 ml-11">
              <div className="flex items-center gap-2 mb-3">
                <Quote className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Evidence ({painPoint.quotes.length})
                </span>
              </div>

              {painPoint.quotes.map((quote, qIndex) => (
                <QuoteCard key={`${quote.text.slice(0, 20)}-${qIndex}`} quote={quote} index={qIndex} />
              ))}
            </div>
          )}

          {/* No quotes yet indicator */}
          {painPoint.quotes.length === 0 && (
            <div className="ml-11 flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 text-xs text-muted-foreground">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"
                  style={{ animationDelay: "200ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"
                  style={{ animationDelay: "400ms" }}
                />
              </div>
              <span>Finding supporting quotes...</span>
            </div>
          )}
        </div>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

/**
 * Individual quote card
 */
function QuoteCard({ quote, index }: { quote: SearchResultItem["quotes"][0]; index: number }) {
  return (
    <div
      className="animate-reveal-up"
      style={{
        animationDelay: `${Math.min(index * 50, 200)}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div className="relative rounded-lg border border-border/40 bg-secondary/30 hover:bg-secondary/50 p-3.5 transition-all duration-200 group/quote">
        {/* Quote indicator */}
        <div className="absolute left-0 top-3.5 bottom-3.5 w-0.5 bg-gradient-to-b from-primary/50 to-primary/20" />

        {/* Quote text */}
        <p className="text-sm text-foreground/90 leading-relaxed mb-3 pl-3">
          &ldquo;{quote.text}&rdquo;
        </p>

        {/* Quote metadata */}
        <div className="flex items-center justify-between gap-3 pl-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {/* Author */}
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3" />
              <span className="font-medium">{quote.author}</span>
            </div>

            {/* Upvotes */}
            {quote.upvotes > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary/50">
                <ArrowBigUp className="w-3 h-3" />
                <span className="font-semibold tabular-nums">{quote.upvotes}</span>
              </div>
            )}
          </div>

          {/* Link to HN */}
          {quote.permalink && (
            <a
              href={quote.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/50 hover:bg-primary/10 text-xs text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover/quote:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="font-medium">View</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
