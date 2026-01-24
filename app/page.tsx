import { Suspense } from "react";
import type { Metadata } from "next";
import { HomeContent } from "@/components/home-content";
import { SITE_CONFIG } from "@/constants/branding";

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

  // Default metadata for landing page (inherits from layout)
  if (!query) {
    return {
      alternates: {
        canonical: "/",
      },
    };
  }

  // Dynamic metadata for search results
  const title = `${query} Startup Ideas — ${SITE_CONFIG.name}`;
  const description = `Find startup ideas related to "${query}" by analyzing real user pain points from Hacker News discussions. Discover validated business opportunities.`;

  // Build OG image URL
  const ogParams = new URLSearchParams();
  ogParams.set("q", query);
  if (searchId) ogParams.set("searchId", searchId);
  const ogImageUrl = `/api/og?${ogParams.toString()}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/?q=${encodeURIComponent(query)}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Startup ideas for ${query}`,
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
