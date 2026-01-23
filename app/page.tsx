import { Suspense } from "react";
import type { Metadata } from "next";
import { HomeContent } from "@/components/home-content";

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Generate dynamic metadata for home page
 * Creates unique OG images for each search topic
 */
export async function generateMetadata({
  searchParams,
}: HomePageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : undefined;
  const searchId = typeof params.searchId === "string" ? params.searchId : undefined;

  // Default metadata for landing page
  if (!query) {
    return {
      title: "Reminer — Mine Real Pain Points from Hacker News",
      description:
        "Discover validated product ideas, customer complaints, and market opportunities by analyzing authentic Hacker News discussions. AI-powered user research in seconds.",
      openGraph: {
        title: "Reminer — Mine Real Pain Points from Hacker News",
        description:
          "Discover validated product ideas, customer complaints, and market opportunities by analyzing authentic Hacker News discussions.",
        type: "website",
        siteName: "Reminer",
        images: [
          {
            url: "/api/og",
            width: 1200,
            height: 630,
            alt: "Reminer - Mine Pain Points from Hacker News",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Reminer — Mine Real Pain Points from Hacker News",
        description:
          "Discover validated product ideas, customer complaints, and market opportunities by analyzing authentic Hacker News discussions.",
        images: ["/api/og"],
      },
    };
  }

  // Dynamic metadata for search results
  const title = `${query} Pain Points — Reminer`;
  const description = `Discover real user pain points about "${query}" from Hacker News discussions. AI-powered user research.`;

  // Build OG image URL
  const ogParams = new URLSearchParams();
  ogParams.set("q", query);
  if (searchId) ogParams.set("searchId", searchId);
  const ogImageUrl = `/api/og?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Reminer",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Pain points for ${query}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
