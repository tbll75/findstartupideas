import { Suspense } from "react";
import { HeroSection } from "@/components/hero-section";
import { SearchSection } from "@/components/search-section";

function HomeContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <HeroSection />
        <SearchSection />
      </main>
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
