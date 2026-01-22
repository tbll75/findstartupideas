"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useCases } from "@/constants"

export function UseCasesSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="use-cases"
      className="relative py-28 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/25" />

      <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
        {/* Section Header */}
        <div
          className={cn(
            "max-w-3xl mx-auto text-center mb-18 lg:mb-22 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-card border border-border/50 text-sm font-medium text-muted-foreground mb-8 shadow-card">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Use Cases</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] tracking-[-0.02em] text-balance leading-[1.1] mb-6">
            Built for builders
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            Whether you're validating a startup idea or researching competitors, Reminer gives you the insights you need.
          </p>
        </div>

        {/* Use Case Cards */}
        <div className={cn(
          "grid md:grid-cols-2 gap-5 lg:gap-6 transition-all duration-700 delay-200",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon
            const isHovered = hoveredCard === index
            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                className={cn(
                  "group relative rounded-3xl transition-all duration-400 overflow-hidden",
                  "bg-card border border-border/50 shadow-card",
                  "hover:shadow-card-hover hover:border-border/80"
                )}
                style={{ transitionDelay: `${index * 75}ms` }}
              >
                {/* Gradient background on hover */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-400",
                    useCase.bgGradient,
                    isHovered && "opacity-100"
                  )}
                />

                <div className="relative z-10 p-8 lg:p-9">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className={cn(
                        "w-13 h-13 rounded-2xl flex items-center justify-center shadow-elevation-1 transition-transform duration-400",
                        useCase.iconBg,
                        "group-hover:scale-105"
                      )}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={cn(
                      "px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider",
                      "bg-secondary/70",
                      useCase.accentColor
                    )}>
                      {useCase.subtitle}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-[1.375rem] lg:text-2xl font-semibold mb-2.5 text-foreground leading-tight">
                    {useCase.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-7">
                    {useCase.description}
                  </p>

                  {/* Example Card */}
                  <div className={cn(
                    "rounded-2xl p-5 border transition-all duration-300",
                    isHovered 
                      ? "bg-card/95 border-border/50 shadow-sm" 
                      : "bg-secondary/40 border-transparent"
                  )}>
                    <div className="flex items-center gap-2 mb-3.5">
                      <span className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold",
                        useCase.iconBg
                      )}>
                        ?
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Example
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm text-muted-foreground">Search:</span>
                        <code className="px-2.5 py-1 rounded-lg bg-foreground/5 text-sm font-mono text-foreground font-medium border border-border/40">
                          {useCase.example.search}
                        </code>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {useCase.example.insight}
                      </p>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/search?q=${encodeURIComponent(useCase.example.search)}`}
                    className={cn(
                      "inline-flex items-center gap-2 mt-7 text-sm font-semibold transition-all duration-300 group/link focus-ring rounded-md",
                      useCase.accentColor
                    )}
                  >
                    <span className="relative">
                      Try this search
                      <span className={cn(
                        "absolute -bottom-0.5 left-0 w-full h-0.5 rounded-full scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 origin-left",
                        `bg-gradient-to-r ${useCase.gradient}`
                      )} />
                    </span>
                    <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
