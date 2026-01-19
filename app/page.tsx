import { Suspense } from "react";
import { Hero } from "@/components/hero";
import { SearchSection } from "@/components/search-section";

function HomeContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="relative flex-1">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-gradient-to-b from-primary/8 via-primary/4 to-transparent rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-orange-200/20 to-amber-100/10 rounded-full blur-[80px] pointer-events-none animate-float" />
        <div
          className="absolute top-40 right-1/4 w-[300px] h-[300px] bg-gradient-to-bl from-rose-100/15 to-orange-50/10 rounded-full blur-[60px] pointer-events-none animate-float"
          style={{ animationDelay: "-2s" }}
        />

        {/* Subtle grid pattern overlay for texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        <Hero />
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
