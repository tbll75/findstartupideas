import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SearchSection } from "@/components/search-section";
import type { Metadata } from "next";

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Generate dynamic metadata for search pages
 * Creates unique OG images for each search topic
 */
export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : undefined;
  const searchId = typeof params.searchId === "string" ? params.searchId : undefined;

  const title = query
    ? `${query} Pain Points — Reminer`
    : "Search Pain Points — Reminer";

  const description = query
    ? `Discover real user pain points about "${query}" from Hacker News discussions. AI-powered user research.`
    : "Discover validated product ideas and customer complaints by analyzing authentic Hacker News discussions.";

  // Build OG image URL
  const ogParams = new URLSearchParams();
  if (query) ogParams.set("q", query);
  if (searchId) ogParams.set("searchId", searchId);
  const ogImageUrl = `/api/og${ogParams.toString() ? `?${ogParams.toString()}` : ""}`;

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
          alt: query ? `Pain points for ${query}` : "Reminer - Mine Pain Points from Hacker News",
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

function SearchContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <Link href="/" className="font-serif text-xl font-medium text-foreground">
            Reminer
          </Link>
        </div>
      </header>
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight text-balance leading-tight mb-4">
            Search Pain Points
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Enter a keyword to discover what users are struggling with across Hacker News discussions.
          </p>
        </div>
        <SearchSection />
      </main>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  )
}
