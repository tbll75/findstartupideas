"use client";

import { forwardRef } from "react";
import { Sparkles, TrendingUp, Quote, User, ArrowBigUp } from "lucide-react";
import type { SearchResultItem } from "@/types";

interface ShareableCardFullProps {
  variant: "full";
  topic: string;
  painPoints: SearchResultItem[];
  summary?: string | null;
}

interface ShareableCardSingleProps {
  variant: "single";
  topic: string;
  painPoint: SearchResultItem;
  index: number;
}

type ShareableCardProps = ShareableCardFullProps | ShareableCardSingleProps;

/**
 * Shareable card component designed for screenshot capture
 * Uses inline styles for consistent rendering with html2canvas
 */
export const ShareableCard = forwardRef<HTMLDivElement, ShareableCardProps>(
  function ShareableCard(props, ref) {
    if (props.variant === "full") {
      return <FullResultsCard ref={ref} {...props} />;
    }
    return <SinglePainPointCard ref={ref} {...props} />;
  }
);

/**
 * Full results card showing topic, summary, and top pain points
 */
const FullResultsCard = forwardRef<HTMLDivElement, ShareableCardFullProps>(
  function FullResultsCard({ topic, painPoints, summary }, ref) {
    const displayPainPoints = painPoints.slice(0, 5);

    return (
      <div
        ref={ref}
        style={{
          width: 600,
          padding: 32,
          background: "linear-gradient(145deg, #faf9f7 0%, #f5f4f0 100%)",
          borderRadius: 20,
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative background */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200, 80, 40, 0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #c85028 0%, #a84420 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(200, 80, 40, 0.25)",
            }}
          >
            <Sparkles style={{ width: 22, height: 22, color: "white" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#c85028",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 2,
              }}
            >
              Startup Ideas for
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "#1a1a18",
                fontFamily: "Georgia, serif",
              }}
            >
              {topic}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              background: "rgba(255, 102, 0, 0.1)",
              border: "1px solid rgba(255, 102, 0, 0.2)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff6600">
              <path d="M0 24V0h24v24H0zM11.97 12.53L7.22 3.64H5.25l5.76 10.75v6.97h2.09v-6.97L18.86 3.64h-1.97l-4.92 8.89z" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#ff6600" }}>HN</span>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div
            style={{
              padding: 16,
              marginBottom: 20,
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(147, 51, 234, 0.08) 0%, rgba(147, 51, 234, 0.04) 100%)",
              border: "1px solid rgba(147, 51, 234, 0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <Sparkles style={{ width: 12, height: 12, color: "#9333ea" }} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#9333ea",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                AI Summary
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: "#3a3a38",
                margin: 0,
              }}
            >
              {summary.slice(0, 200)}
              {summary.length > 200 ? "..." : ""}
            </p>
          </div>
        )}

        {/* Pain Points Count */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingUp style={{ width: 14, height: 14, color: "white" }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#6b21a8" }}>
            {painPoints.length} Pain Points Found
          </span>
        </div>

        {/* Pain Points List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {displayPainPoints.map((pp, i) => (
            <div
              key={pp.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.8)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: "linear-gradient(135deg, #c85028 0%, #a84420 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#2a2a28",
                  flex: 1,
                  lineHeight: 1.3,
                }}
              >
                {pp.painTitle.slice(0, 70)}
                {pp.painTitle.length > 70 ? "..." : ""}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#666",
                  background: "rgba(0, 0, 0, 0.05)",
                  padding: "3px 8px",
                  borderRadius: 4,
                  whiteSpace: "nowrap",
                }}
              >
                {pp.mentions} mentions
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid rgba(0, 0, 0, 0.06)",
          }}
        >
          <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>
            findstartupideas.com
          </span>
          <span style={{ fontSize: 11, color: "#aaa" }}>
            AI-powered startup idea discovery
          </span>
        </div>
      </div>
    );
  }
);

/**
 * Single pain point card with quotes
 */
const SinglePainPointCard = forwardRef<HTMLDivElement, ShareableCardSingleProps>(
  function SinglePainPointCard({ topic, painPoint, index }, ref) {
    const displayQuotes = painPoint.quotes.slice(0, 3);

    return (
      <div
        ref={ref}
        style={{
          width: 520,
          padding: 28,
          background: "linear-gradient(145deg, #faf9f7 0%, #f5f4f0 100%)",
          borderRadius: 20,
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative background */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200, 80, 40, 0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "linear-gradient(135deg, #c85028 0%, #a84420 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 16,
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(200, 80, 40, 0.25)",
            }}
          >
            #{index + 1}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#c85028",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 4,
              }}
            >
              Pain Point • {topic}
            </div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1a1a18",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {painPoint.painTitle}
            </h2>
          </div>
        </div>

        {/* Mentions badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 6,
              background: "rgba(147, 51, 234, 0.1)",
              border: "1px solid rgba(147, 51, 234, 0.15)",
            }}
          >
            <TrendingUp style={{ width: 14, height: 14, color: "#9333ea" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#9333ea" }}>
              {painPoint.mentions} mentions
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 10px",
              borderRadius: 6,
              background: "rgba(255, 102, 0, 0.1)",
              border: "1px solid rgba(255, 102, 0, 0.2)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff6600">
              <path d="M0 24V0h24v24H0zM11.97 12.53L7.22 3.64H5.25l5.76 10.75v6.97h2.09v-6.97L18.86 3.64h-1.97l-4.92 8.89z" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#ff6600" }}>
              Hacker News
            </span>
          </div>
        </div>

        {/* Quotes */}
        {displayQuotes.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
              }}
            >
              <Quote style={{ width: 12, height: 12, color: "#888" }} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Evidence ({painPoint.quotes.length})
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {displayQuotes.map((quote, i) => (
                <div
                  key={i}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.8)",
                    border: "1px solid rgba(0, 0, 0, 0.06)",
                    borderLeft: "3px solid #c85028",
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: "#3a3a38",
                      margin: "0 0 10px 0",
                    }}
                  >
                    &ldquo;{quote.text.slice(0, 150)}
                    {quote.text.length > 150 ? "..." : ""}&rdquo;
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <User style={{ width: 11, height: 11, color: "#888" }} />
                      <span style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>
                        {quote.author}
                      </span>
                    </div>
                    {quote.upvotes > 0 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "rgba(0, 0, 0, 0.04)",
                        }}
                      >
                        <ArrowBigUp style={{ width: 11, height: 11, color: "#888" }} />
                        <span style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>
                          {quote.upvotes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 14,
            borderTop: "1px solid rgba(0, 0, 0, 0.06)",
          }}
        >
          <span style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>
            findstartupideas.com
          </span>
          <span style={{ fontSize: 10, color: "#aaa" }}>
            AI-powered startup idea discovery
          </span>
        </div>
      </div>
    );
  }
);
