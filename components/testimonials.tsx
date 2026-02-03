"use client";

import { useEffect, useRef, useState } from "react";
import { Quote, Sparkles, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { testimonials } from "@/constants";

export function TestimonialsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="relative py-28 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 via-secondary/25 to-background" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Decorative orb */}
      <div
        className="absolute top-[20%] left-[3%] w-[400px] h-[400px] rounded-full opacity-20 animate-float-slow pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.60 0.21 30 / 0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />

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
            <span>Success Stories</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] tracking-[-0.02em] text-balance leading-[1.1] mb-6">
            Real discoveries,
            <br />
            <span className="text-muted-foreground">real opportunities</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            See what others have found using Find Startup Ideas to validate
            ideas and discover market gaps.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div
          className={cn(
            "grid lg:grid-cols-3 gap-5 lg:gap-6 transition-all duration-700 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {testimonials.map((testimonial, index) => {
            const Icon = testimonial.icon;
            const isActive = activeCard === index;
            return (
              <div
                key={index}
                onMouseEnter={() => setActiveCard(index)}
                className={cn(
                  "group relative rounded-3xl transition-all duration-400 overflow-hidden",
                  "bg-card border border-border/50 shadow-card",
                  isActive
                    ? "shadow-card-hover border-border/80 scale-[1.01] z-10"
                    : "hover:shadow-card-hover hover:border-border/70"
                )}
              >
                {/* Glow effect */}
                <div
                  className={cn(
                    "absolute -top-20 -right-20 w-44 h-44 rounded-full blur-3xl transition-opacity duration-500 pointer-events-none",
                    isActive ? "opacity-80" : "opacity-0"
                  )}
                  style={{ background: testimonial.bgGlow }}
                />

                <div className="relative z-10 p-8 lg:p-9">
                  {/* Quote icon */}
                  <Quote
                    className={cn(
                      "absolute top-6 right-6 w-9 h-9 transition-colors duration-400",
                      isActive ? "text-primary/15" : "text-border"
                    )}
                  />

                  {/* Icon badge */}
                  <div
                    className={cn(
                      "inline-flex items-center justify-center w-13 h-13 rounded-2xl mb-6 shadow-elevation-1 transition-transform duration-400",
                      `bg-gradient-to-br ${testimonial.gradient}`,
                      isActive && "scale-105"
                    )}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Quote */}
                  <h3 className="text-xl font-semibold mb-3 text-foreground leading-snug pr-8">
                    &ldquo;{testimonial.highlight}&rdquo;
                  </h3>

                  {/* Author */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xs font-bold text-foreground/80">
                      {testimonial.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {testimonial.author}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed mb-6 text-[15px]">
                    {testimonial.description}
                  </p>

                  {/* Search example */}
                  <div
                    className={cn(
                      "rounded-2xl p-4 mb-4 transition-colors duration-300",
                      isActive ? "bg-secondary/70" : "bg-secondary/40"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <Search className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Search term
                      </span>
                    </div>
                    <code
                      className={cn(
                        "inline-block px-2.5 py-1 rounded-lg text-sm font-mono font-medium border",
                        "bg-card text-foreground border-border/40"
                      )}
                    >
                      {testimonial.searchTerm}
                    </code>
                  </div>

                  {/* Discoveries */}
                  <div className="space-y-1.5">
                    {testimonial.discoveries.map((discovery, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 text-sm text-muted-foreground"
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full transition-colors duration-300",
                            isActive ? "bg-primary" : "bg-border"
                          )}
                        />
                        {discovery}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mt-10">
          {testimonials.map((testimonial, index) => (
            <button
              type="button"
              key={index}
              onClick={() => setActiveCard(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-400",
                activeCard === index
                  ? `w-10 bg-gradient-to-r ${testimonial.gradient}`
                  : "w-1.5 bg-border hover:bg-muted-foreground/30"
              )}
              aria-label={`View testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
