import { Suspense } from "react";
import { HeroSection } from "@/components/hero-section";
import { SearchSection } from "@/components/search-section";
import { ExampleSearches } from "@/components/example-searches";
import { RecentSearches } from "@/components/recent-searches";
import { Footer } from "@/components/footer";

function HomeContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <HeroSection />
        <SearchSection />
        <ExampleSearches />
        <RecentSearches />
      </main>
      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
