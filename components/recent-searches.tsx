"use client"

import { useState, useEffect, useRef } from "react"
import { Clock, ArrowRight, Users, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const recentSearches = [
  { keyword: "CRM software alternatives", time: "2 min ago", searches: 47 },
  { keyword: "Stripe integration issues", time: "5 min ago", searches: 89 },
  { keyword: "Productivity apps 2024", time: "8 min ago", searches: 156 },
  { keyword: "Remote team management", time: "12 min ago", searches: 234 },
  { keyword: "No-code platforms", time: "15 min ago", searches: 178 },
  { keyword: "SEO tools for startups", time: "18 min ago", searches: 145 },
  { keyword: "Email marketing automation", time: "22 min ago", searches: 312 },
  { keyword: "Landing page builders", time: "25 min ago", searches: 267 },
]

export function RecentSearches() {
  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer || isPaused) return

    let animationId: number
    let scrollPosition = 0
    const speed = 0.5

    const animate = () => {
      scrollPosition += speed
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0
      }
      scrollContainer.scrollLeft = scrollPosition
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [isPaused])

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      {/* Multi-layered background for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 via-secondary/60 to-secondary/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,88,12,0.03),transparent_50%)]" />

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
                <div className="absolute -inset-1 rounded-full bg-green-500/20 animate-pulse" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Live Feed</span>
            </div>
            <h2
              className="font-serif text-4xl lg:text-5xl tracking-tight"
              style={{ textShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
            >
              What others are exploring
            </h2>
          </div>
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-card/80 border border-border/50 backdrop-blur-sm"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">1,234</span> active researchers
            </span>
          </div>
        </div>

        {/* Carousel container */}
        <div className="relative" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-secondary/60 via-secondary/30 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-secondary/60 via-secondary/30 to-transparent z-10 pointer-events-none" />

          <div ref={scrollRef} className="flex gap-4 overflow-hidden py-2" style={{ scrollBehavior: "auto" }}>
            {[...recentSearches, ...recentSearches].map((search, index) => (
              <button
                key={`${search.keyword}-${index}`}
                className={cn(
                  "group flex-shrink-0 p-5 rounded-xl relative overflow-hidden",
                  "bg-card",
                  "transition-all duration-300 hover:-translate-y-1",
                  "min-w-[300px]",
                )}
                style={{
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02), 0 4px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 8px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 4px rgba(0,0,0,0.02), 0 4px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)"
                }}
              >
                {/* Top highlight for 3D effect */}
                <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

                {/* Hover glow */}
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{search.time}</span>
                    </div>
                    <ArrowRight
                      className={cn(
                        "w-4 h-4 text-muted-foreground transition-all duration-300",
                        "group-hover:text-primary group-hover:translate-x-1",
                      )}
                    />
                  </div>

                  <h3 className="text-sm font-semibold text-left mb-3 line-clamp-1 group-hover:text-foreground transition-colors">
                    {search.keyword}
                  </h3>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-bold text-primary">{search.searches}</span>
                      <span className="text-muted-foreground">people searched this</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6 text-lg">Ready to discover your next big idea?</p>
          <button
            className={cn(
              "group inline-flex items-center gap-3 px-8 py-4 rounded-full font-medium",
              "bg-foreground text-background",
              "transition-all duration-300 hover:-translate-y-1",
              "relative overflow-hidden shimmer-hover",
            )}
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2), 0 16px 40px rgba(0,0,0,0.15)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.1)"
            }}
          >
            {/* Inner top highlight */}
            <span className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <Sparkles className="w-4 h-4" />
            <span>Start Mining</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  )
}
