"use client";

import { useSearchParams } from "next/navigation";
import { HeroSection } from "@/components/hero";
import { HowItWorksSection } from "@/components/how-it-works";
import { UseCasesSection } from "@/components/use-cases";
import { TestimonialsSection } from "@/components/testimonials";
import { FAQSection } from "@/components/faq";
import { CTASection } from "@/components/cta";
import { SearchSection } from "@/components/search-section";

/**
 * Client component that handles the dynamic home page content
 * Shows/hides sections based on search state
 */
export function HomeContent() {
  const searchParams = useSearchParams();
  const hasSearchQuery = searchParams.has("q") && (searchParams.get("q")?.length ?? 0) >= 2;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero section with integrated search - always visible */}
        <HeroSection />
        
        {/* Search section - always visible for results */}
        <SearchSection />
        
        {/* Landing page sections - hidden when searching */}
        {!hasSearchQuery && (
          <>
            <HowItWorksSection />
            <UseCasesSection />
            <TestimonialsSection />
            <FAQSection />
            <CTASection />
          </>
        )}
      </main>
    </div>
  );
}
