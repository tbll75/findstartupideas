"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative pt-28 overflow-hidden">
      {/* Layered gradient orbs for multi-dimensional depth */}
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

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-b from-card to-secondary border border-border/60 mb-8 transition-all duration-700 shadow-elevation-1 relative overflow-hidden ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{
              boxShadow:
                "var(--shadow-elevation-1), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            <div className="relative">
              <Sparkles className="w-4 h-4 text-primary" />
              <div className="absolute inset-0 text-primary blur-sm opacity-50">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <span className="text-sm font-medium text-foreground/80">
              AI-Powered Market Research
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          </div>

          <h1
            className={`font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl tracking-tight text-balance leading-[1.1] mb-6 transition-all duration-700 delay-100 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ textShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
          >
            Mine real pain points
            <br />
            <span className="text-primary relative">
              from Hacker News
              <span
                className="absolute inset-0 text-primary blur-lg opacity-30"
                aria-hidden="true"
              >
                from Hacker News
              </span>
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className={`text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12 text-pretty transition-all duration-700 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Discover validated product ideas, customer complaints, and market
            opportunities by analyzing authentic conversations happening right
            now across the Hacker News community.
          </p>
        </div>
      </div>
    </section>
  );
}
