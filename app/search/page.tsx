import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SearchSection } from "@/components/search-section";

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
