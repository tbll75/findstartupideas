"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Sparkles, ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { trustFeatures } from "@/constants"

export function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative min-h-[92vh] flex items-center pt-28 pb-20 overflow-hidden">
      {/* Premium layered background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Primary gradient dome */}
        <div 
          className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[160%] max-w-[1800px] aspect-square"
          style={{
            background: "radial-gradient(ellipse at center, oklch(0.60 0.21 30 / 0.06) 0%, oklch(0.60 0.21 30 / 0.02) 35%, transparent 65%)",
          }}
        />
        
        {/* Floating ambient orbs */}
        <div 
          className="absolute top-[5%] left-[10%] w-[350px] h-[350px] rounded-full animate-float-slow"
          style={{
            background: "radial-gradient(circle, oklch(0.88 0.10 55 / 0.25) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        <div 
          className="absolute top-[15%] right-[8%] w-[450px] h-[450px] rounded-full animate-float-delayed"
          style={{
            background: "radial-gradient(circle, oklch(0.78 0.08 75 / 0.18) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div 
          className="absolute bottom-[15%] left-[15%] w-[280px] h-[280px] rounded-full animate-float"
          style={{
            background: "radial-gradient(circle, oklch(0.92 0.06 40 / 0.2) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: `
              linear-gradient(var(--foreground) 1px, transparent 1px),
              linear-gradient(90deg, var(--foreground) 1px, transparent 1px)
            `,
            backgroundSize: "100px 100px",
          }}
        />

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 lg:px-8 w-full">
        <div className="max-w-4xl mx-auto text-center">
          {/* Announcement badge */}
          <div
            className={cn(
              "inline-flex items-center gap-3 px-5 py-2.5 rounded-full mb-10 transition-all duration-700",
              "bg-card border border-border/50 shadow-card",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
          >
            <span className="relative flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary relative z-10" />
              <span className="absolute inset-0 text-primary blur-sm opacity-50">
                <Sparkles className="w-4 h-4" />
              </span>
            </span>
            <span className="text-sm font-medium text-foreground/90">
              AI-Powered Market Research
            </span>
            <span className="flex items-center gap-1.5 pl-2 border-l border-border/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-emerald-600">Live</span>
            </span>
          </div>

          {/* Main headline */}
          <h1
            className={cn(
              "font-serif text-[clamp(2.75rem,6vw,5.5rem)] tracking-[-0.02em] text-balance leading-[1.05] mb-7 transition-all duration-700 delay-100",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
          >
            <span className="block">Mine real pain points</span>
            <span className="relative inline-block mt-1">
              <span className="relative z-10 text-primary">from Hacker News</span>
              <svg 
                className="absolute -bottom-1 left-0 w-full h-3 text-primary/25 overflow-visible"
                viewBox="0 0 200 12" 
                preserveAspectRatio="none"
                fill="none"
                aria-hidden="true"
              >
                <path 
                  d="M2 9 Q 50 2, 100 9 T 198 9" 
                  stroke="currentColor" 
                  strokeWidth="3"
                  strokeLinecap="round"
                  className={cn(
                    mounted && "animate-draw"
                  )}
                  style={{ animationDelay: "0.6s" }}
                />
              </svg>
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className={cn(
              "text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-11 text-pretty transition-all duration-700 delay-200",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
          >
            Discover validated product ideas, customer complaints, and market
            opportunities by analyzing authentic conversations happening right
            now across the Hacker News community.
          </p>

          {/* CTA Buttons */}
          <div
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 transition-all duration-700 delay-300",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
          >
            <Link href="/search">
              <Button
                size="lg"
                className={cn(
                  "h-14 px-8 bg-foreground text-background font-semibold rounded-2xl text-base",
                  "shadow-elevation-2 hover:shadow-elevation-3",
                  "transition-all duration-300 btn-press shimmer-hover group"
                )}
              >
                <span className="flex items-center gap-2.5">
                  Start Searching Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Button>
            </Link>
            <a
              href="#how-it-works"
              className={cn(
                "inline-flex items-center gap-3 h-14 px-5 rounded-2xl",
                "text-muted-foreground hover:text-foreground",
                "font-medium transition-all duration-300 group",
                "hover:bg-secondary/60 focus-ring"
              )}
            >
              <span className={cn(
                "w-11 h-11 rounded-xl border-2 border-border/80 flex items-center justify-center",
                "group-hover:border-foreground group-hover:bg-foreground group-hover:text-background",
                "transition-all duration-300"
              )}>
                <Play className="w-4 h-4 ml-0.5" />
              </span>
              <span>See how it works</span>
            </a>
          </div>

          {/* Trust features */}
          <div
            className={cn(
              "transition-all duration-700 delay-400",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
          >
            <div className="inline-flex flex-col sm:flex-row items-center gap-6 lg:gap-8 py-5 px-7 rounded-2xl bg-secondary/50 border border-border/40">
              {trustFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-card flex items-center justify-center shadow-xs border border-border/40">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">{feature.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
