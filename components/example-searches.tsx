"use client"

import { useState } from "react"
import { Zap, MessageSquare, Lightbulb, TrendingUp, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const examples = [
  {
    keyword: "Shopify",
    category: "E-commerce",
    painPoints: 847,
    icon: TrendingUp,
    accentColor: "from-orange-500 to-red-500",
    bgGradient: "from-orange-50 to-rose-50",
  },
  {
    keyword: "Notion",
    category: "Productivity",
    painPoints: 1203,
    icon: Lightbulb,
    accentColor: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50",
  },
  {
    keyword: "Remote Work",
    category: "Lifestyle",
    painPoints: 2156,
    icon: MessageSquare,
    accentColor: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-50 to-teal-50",
  },
  {
    keyword: "AI Tools",
    category: "Technology",
    painPoints: 3421,
    icon: Zap,
    accentColor: "from-primary to-orange-500",
    bgGradient: "from-orange-50 to-amber-50",
  },
]

export function ExampleSearches() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-border/50 mb-6 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Popular Topics</span>
          </div>
          <h2
            className="font-serif text-4xl lg:text-5xl tracking-tight mb-5"
            style={{ textShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
          >
            See what's possible
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Explore popular topics and discover the pain points people are discussing right now
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {examples.map((example, index) => {
            const Icon = example.icon
            const isHovered = hoveredIndex === index
            return (
              <button
                key={example.keyword}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "group relative p-6 rounded-2xl text-left transition-all duration-500 ease-out",
                  "bg-card overflow-hidden",
                  "hover:-translate-y-2",
                )}
                style={{
                  boxShadow: isHovered
                    ? "0 8px 16px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)"
                    : "0 2px 4px rgba(0,0,0,0.02), 0 4px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500",
                    example.bgGradient,
                    isHovered && "opacity-100",
                  )}
                />

                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

                <div
                  className={cn(
                    "absolute -top-20 -right-20 w-40 h-40 rounded-full transition-opacity duration-500",
                    `bg-gradient-to-br ${example.accentColor}`,
                    "blur-3xl opacity-0",
                    isHovered && "opacity-20",
                  )}
                />

                <div className="relative">
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 relative overflow-hidden",
                        isHovered ? `bg-gradient-to-br ${example.accentColor} shadow-lg` : "bg-secondary",
                      )}
                      style={isHovered ? { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" } : undefined}
                    >
                      {/* Inner highlight */}
                      <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      <Icon
                        className={cn(
                          "w-5 h-5 transition-all duration-500 relative z-10",
                          isHovered ? "text-white scale-110" : "text-muted-foreground",
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-300",
                        isHovered ? "bg-foreground/10 text-foreground" : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {example.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold mb-2 group-hover:text-foreground transition-colors duration-200">
                    {example.keyword}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    <span
                      className={cn(
                        "font-semibold transition-colors duration-300",
                        isHovered ? "text-primary" : "text-foreground",
                      )}
                    >
                      {example.painPoints.toLocaleString()}
                    </span>{" "}
                    pain points found
                  </p>
                </div>

                <div
                  className={cn(
                    "absolute bottom-6 right-6 w-10 h-10 rounded-full flex items-center justify-center",
                    "transition-all duration-500 overflow-hidden",
                    isHovered
                      ? `bg-gradient-to-br ${example.accentColor} opacity-100 translate-x-0 shadow-lg`
                      : "bg-foreground opacity-0 translate-x-4",
                  )}
                  style={isHovered ? { boxShadow: "0 4px 12px rgba(0,0,0,0.2)" } : undefined}
                >
                  <ArrowRight
                    className={cn(
                      "w-4 h-4 transition-all duration-300",
                      isHovered ? "text-white translate-x-0.5" : "text-background",
                    )}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
