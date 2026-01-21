import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero"
import { HowItWorksSection } from "@/components/how-it-works"
import { UseCasesSection } from "@/components/use-cases"
import { TestimonialsSection } from "@/components/testimonials"
import { FAQSection } from "@/components/faq"
import { CTASection } from "@/components/cta"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <UseCasesSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
