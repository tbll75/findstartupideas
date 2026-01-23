"use client"

import React from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { features } from "@/constants"

export function CTASection() {
  const [isVisible, setIsVisible] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative py-28 overflow-hidden"
    >
      {/* Dark background */}
      <div className="absolute inset-0 bg-foreground" />
      
      {/* Interactive spotlight */}
      <div 
        className="absolute inset-0 opacity-30 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(700px circle at ${mousePosition.x}% ${mousePosition.y}%, oklch(0.60 0.21 30 / 0.12), transparent 45%)`,
        }}
        aria-hidden="true"
      />

      {/* Floating orbs */}
      <div 
        className="absolute top-[-5%] left-1/4 w-[500px] h-[500px] rounded-full animate-float-slow pointer-events-none"
        style={{
          background: "radial-gradient(circle, oklch(0.60 0.21 30 / 0.15) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-[-5%] right-1/4 w-[400px] h-[400px] rounded-full animate-float-delayed pointer-events-none"
        style={{
          background: "radial-gradient(circle, oklch(0.60 0.21 30 / 0.12) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />
      
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)`,
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />

      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative max-w-5xl mx-auto px-5 lg:px-8 text-center">
        <div
          className={cn(
            "transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/8 border border-white/15 text-sm font-medium text-white/85 mb-10 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Start for free today</span>
          </div>

          {/* Headline */}
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-[4rem] tracking-[-0.02em] text-balance leading-[1.08] text-white mb-7">
            Ready to discover what
            <br />
            <span className="relative inline-block">
              users really want?
              <svg 
                className="absolute -bottom-1.5 left-0 w-full h-3.5 text-primary/35 overflow-visible"
                viewBox="0 0 200 12" 
                preserveAspectRatio="none"
                fill="none"
                aria-hidden="true"
              >
                <path 
                  d="M2 9 Q 50 2, 100 9 T 198 9" 
                  stroke="currentColor" 
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg lg:text-xl text-white/60 max-w-2xl mx-auto mb-11 text-pretty leading-relaxed">
            Stop guessing. Start building products people actually need. Get validated insights from real conversations in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Button
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className={cn(
                "cursor-pointer h-14 px-9 bg-white text-foreground font-semibold rounded-2xl text-base",
                "shadow-[0_2px_16px_rgba(255,255,255,0.12),0_8px_32px_rgba(255,255,255,0.08)]",
                "hover:shadow-[0_4px_24px_rgba(255,255,255,0.18),0_12px_40px_rgba(255,255,255,0.12)]",
                "transition-all duration-300 btn-press group"
              )}
            >
              <span className="flex items-center gap-2.5">
                Start Searching Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Button>
            <a
              href="#how-it-works"
              className={cn(
                "inline-flex items-center gap-2 h-14 px-7 rounded-2xl",
                "text-white/70 hover:text-white",
                "font-medium transition-all duration-300",
                "border border-white/15 hover:border-white/30 hover:bg-white/5 focus-ring"
              )}
            >
              Learn how it works
            </a>
          </div>

          {/* Trust features */}
          <div className="pt-10 border-t border-white/10">
            <p className="text-xs text-white/40 mb-7 font-medium uppercase tracking-wider">
              Everything you need to validate your ideas
            </p>
            <div className="flex flex-wrap items-center justify-center gap-5 lg:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center border border-white/8">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-white/60 font-medium">{feature.text}</span>
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
