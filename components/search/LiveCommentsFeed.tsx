"use client";

import { useMemo } from "react";
import { MessageCircle, User, ArrowBigUp, ExternalLink } from "lucide-react";

/** Decodes HTML entities (e.g. &#x27; → ') for safe display. Pure JS for SSR compatibility. */
function decodeHtmlEntities(str: string): string {
  if (typeof str !== "string" || !str) return str;
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&sol;/g, "/");
}

interface CommentPreview {
  id: string;
  snippet: string;
  author?: string;
  upvotes?: number;
  permalink?: string;
}

interface LiveCommentsFeedProps {
  comments: CommentPreview[];
  commentsCount: number;
  phase: string;
}

/**
 * Premium live comments feed showing real-time comment analysis
 * Uses CSS animations for smooth staggered appearance
 */
export function LiveCommentsFeed({
  comments,
  commentsCount,
  phase,
}: LiveCommentsFeedProps) {
  // Display last 10 comments (most recent)
  const displayComments = useMemo(() => comments.slice(-10).reverse(), [comments]);

  // Don't render if no comments and not in comments phase
  if (!comments.length && phase !== "comments") return null;

  return (
    <div className="mt-8 space-y-6">
      {/* Header Section */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-blue-500/5 flex items-center justify-center shadow-elevation-2">
                <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              {phase === "comments" && (
                <div className="absolute -top-1 -right-1 w-3 h-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Mining Comments
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Analyzed{" "}
                <span className="text-blue-600 dark:text-blue-400 font-semibold tabular-nums">
                  {commentsCount > 0 ? commentsCount : comments.length}
                </span>{" "}
                comments for insights
              </p>
            </div>
          </div>

          {phase === "comments" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Analyzing
              </span>
            </div>
          )}
        </div>

        {/* Progress indicator line */}
        <div className="absolute -bottom-3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Comments Feed */}
      {displayComments.length > 0 && (
        <div className="space-y-3">
          {displayComments.map((comment, index) => (
            <CommentCard key={comment.id} comment={comment} index={index} />
          ))}
        </div>
      )}

      {/* Processing indicator when no comments visible yet */}
      {displayComments.length === 0 && phase === "comments" && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 border border-border/60">
            <div className="flex gap-1.5">
              <div
                className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              Processing comments...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual comment card with animation
 */
function CommentCard({ comment, index }: { comment: CommentPreview; index: number }) {
  return (
    <div
      className="group animate-reveal-up"
      style={{
        animationDelay: `${Math.min(index * 50, 400)}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div className="relative rounded-xl border border-border/60 bg-gradient-to-br from-card to-secondary/20 hover:from-card hover:to-secondary/30 transition-all duration-300 hover:border-blue-500/30 hover:shadow-elevation-2 overflow-hidden">
        {/* Left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500/50 via-blue-500/30 to-transparent" />

        <div className="relative p-4 pl-5">
          {/* Comment text */}
          <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3 mb-3">
            {decodeHtmlEntities(comment.snippet)}
          </p>

          {/* Comment metadata */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {/* Author */}
              {comment.author && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span className="font-medium">{decodeHtmlEntities(comment.author)}</span>
                </div>
              )}

              {/* Upvotes */}
              {typeof comment.upvotes === "number" && comment.upvotes > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/50">
                  <ArrowBigUp className="w-3.5 h-3.5" />
                  <span className="font-semibold tabular-nums">{comment.upvotes}</span>
                </div>
              )}
            </div>

            {/* Link to HN */}
            {comment.permalink && (
              <a
                href={comment.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/50 hover:bg-blue-500/10 text-xs text-muted-foreground hover:text-blue-600 transition-colors group/link"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="font-medium">View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
