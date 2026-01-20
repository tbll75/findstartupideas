"use client";

import { memo, useMemo } from "react";
import { Quote, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeUrl, sanitizeQuote } from "@/lib/security";

interface QuoteItemProps {
  quote: {
    text: string;
    upvotes: number;
    author: string;
    permalink?: string;
  };
}

/**
 * Individual quote display component
 * Memoized for performance
 */
export const QuoteItem = memo(function QuoteItem({ quote }: QuoteItemProps) {
  // Sanitize quote content and URL
  const sanitizedQuote = useMemo(
    () => sanitizeQuote(quote.text),
    [quote.text]
  );
  
  const sanitizedPermalink = useMemo(
    () => (quote.permalink ? sanitizeUrl(quote.permalink) : ""),
    [quote.permalink]
  );

  const hasValidPermalink =
    sanitizedPermalink && !sanitizedPermalink.includes("undefined");

  return (
    <div
      className={cn(
        "relative pl-4 py-3 rounded-xl transition-all duration-200",
        hasValidPermalink
          ? "hover:bg-secondary/40 cursor-pointer"
          : "hover:bg-secondary/30"
      )}
      style={{
        background: "linear-gradient(to right, rgba(0,0,0,0.02), transparent)",
      }}
    >
      {/* Quote indicator line */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{
          background:
            "linear-gradient(to bottom, rgba(234, 88, 12, 0.6), rgba(234, 88, 12, 0.2))",
        }}
      />

      <div className="flex items-start gap-2">
        <Quote className="w-4 h-4 text-primary/40 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {hasValidPermalink ? (
            <a
              href={sanitizedPermalink}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
              title="View on Hacker News"
            >
              <p className="text-sm text-foreground/90 leading-relaxed italic cursor-pointer hover:text-primary transition-colors">
                "{sanitizedQuote}"
              </p>
            </a>
          ) : (
            <p className="text-sm text-foreground/90 leading-relaxed italic">
              "{sanitizedQuote}"
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {quote.author && (
              quote.author !== "Anonymous" ? (
                <a
                  href={
                    hasValidPermalink
                      ? sanitizedPermalink
                      : `https://news.ycombinator.com/user?id=${encodeURIComponent(quote.author)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {quote.author}
                </a>
              ) : (
                <span className="text-xs font-medium text-muted-foreground">
                  {quote.author}
                </span>
              )
            )}
            {hasValidPermalink && (
              <a
                href={sanitizedPermalink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                title="View on Hacker News"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
