import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

export const runtime = "edge";

// Brand configuration for OG images
const BRAND = {
  name: "Find Startup Ideas",
  domain: "findstartupideas.com",
  tagline: "AI-powered startup idea discovery",
} as const;

// OG Image dimensions (Twitter/Facebook standard)
const WIDTH = 1200;
const HEIGHT = 630;

interface PainPointData {
  title: string;
  mentions_count: number;
}

interface SearchData {
  topic: string;
  painPointCount: number;
  topPainPoints: PainPointData[];
  summary?: string;
}

/**
 * Fetch search data from database
 */
async function getSearchData(
  searchId: string | null,
  topic: string
): Promise<SearchData | null> {
  if (!searchId) return null;

  try {
    const supabase = getSupabaseServiceClient();

    // Fetch search and pain points
    const { data: search } = await supabase
      .from("searches")
      .select("id, topic, status")
      .eq("id", searchId)
      .single();

    if (!search || search.status !== "completed") return null;

    const { data: painPoints } = await supabase
      .from("pain_points")
      .select("title, mentions_count")
      .eq("search_id", searchId)
      .order("mentions_count", { ascending: false })
      .limit(3);

    const { data: analysis } = await supabase
      .from("ai_analyses")
      .select("summary")
      .eq("search_id", searchId)
      .maybeSingle();

    return {
      topic: search.topic || topic,
      painPointCount: painPoints?.length || 0,
      topPainPoints: painPoints || [],
      summary: analysis?.summary || undefined,
    };
  } catch (error) {
    console.error("[OG] Failed to fetch search data:", error);
    return null;
  }
}

/**
 * Sanitize text for safe rendering
 */
function sanitize(text: string, maxLength = 100): string {
  return text
    .replace(/[<>&"']/g, "")
    .trim()
    .slice(0, maxLength);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = sanitize(searchParams.get("q") || "Startup Ideas", 50);
  const searchId = searchParams.get("searchId");

  // Try to fetch real data
  const searchData = await getSearchData(searchId, topic);

  // Determine what to display
  const displayTopic = searchData?.topic || topic;
  const painPointCount = searchData?.painPointCount || 0;
  const topPainPoints = searchData?.topPainPoints || [];
  const hasData = painPointCount > 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(145deg, #faf9f7 0%, #f5f4f0 50%, #ebe9e4 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative background elements */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200, 80, 40, 0.08) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -150,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200, 80, 40, 0.05) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "60px 70px",
            position: "relative",
          }}
        >
          {/* Header with logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 40,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* Logo mark */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #c85028 0%, #a84420 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(200, 80, 40, 0.25)",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 500,
                  color: "#1a1a18",
                  fontFamily: "Georgia, serif",
                }}
              >
                {BRAND.name}
              </span>
            </div>

            {/* HN badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 10,
                background: "rgba(255, 102, 0, 0.1)",
                border: "1px solid rgba(255, 102, 0, 0.2)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff6600">
                <path d="M0 24V0h24v24H0zM11.97 12.53L7.22 3.64H5.25l5.76 10.75v6.97h2.09v-6.97L18.86 3.64h-1.97l-4.92 8.89z" />
              </svg>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#ff6600",
                }}
              >
                Hacker News
              </span>
            </div>
          </div>

          {/* Topic */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: "#c85028",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Startup Ideas for
            </span>
            <h1
              style={{
                fontSize: 64,
                fontWeight: 600,
                color: "#1a1a18",
                margin: 0,
                lineHeight: 1.1,
                fontFamily: "Georgia, serif",
              }}
            >
              {displayTopic}
            </h1>
          </div>

          {/* Pain points preview or tagline */}
          {hasData ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <path d="M12 3l1.5 4.5H18l-3.75 2.75L15.75 15 12 12.25 8.25 15l1.5-4.75L6 7.5h4.5L12 3z" />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#6b21a8",
                  }}
                >
                  {painPointCount} Startup Ideas Found
                </span>
              </div>

              {/* Top pain points */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {topPainPoints.slice(0, 3).map((pp, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 20px",
                      borderRadius: 12,
                      background: "rgba(255, 255, 255, 0.7)",
                      border: "1px solid rgba(0, 0, 0, 0.06)",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: "linear-gradient(135deg, #c85028 0%, #a84420 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </div>
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 500,
                        color: "#2a2a28",
                        flex: 1,
                      }}
                    >
                      {sanitize(pp.title, 60)}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#666",
                        background: "rgba(0, 0, 0, 0.05)",
                        padding: "4px 10px",
                        borderRadius: 6,
                      }}
                    >
                      {pp.mentions_count} mentions
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flex: 1,
                alignItems: "center",
              }}
            >
              <p
                style={{
                  fontSize: 26,
                  color: "#555",
                  lineHeight: 1.5,
                  maxWidth: 700,
                }}
              >
                Find validated startup ideas by analyzing real user pain points from authentic Hacker News discussions.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 70px",
            borderTop: "1px solid rgba(0, 0, 0, 0.06)",
            background: "rgba(255, 255, 255, 0.5)",
          }}
        >
          <span
            style={{
              fontSize: 18,
              color: "#666",
            }}
          >
            {BRAND.domain}
          </span>
          <span
            style={{
              fontSize: 16,
              color: "#888",
            }}
          >
            {BRAND.tagline}
          </span>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    }
  );
}
