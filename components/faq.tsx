"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Sparkles, Plus, Minus } from "lucide-react"
import { faqs } from "@/constants"

export function FAQSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
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
      id="faq"
      className="relative py-28 lg:py-36 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/15" />

      <div className="relative max-w-3xl mx-auto px-5 lg:px-8">
        {/* Section Header */}
        <div
          className={cn(
            "text-center mb-14 lg:mb-16 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-card border border-border/50 text-sm font-medium text-muted-foreground mb-8 shadow-card">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>FAQ</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] tracking-[-0.02em] text-balance leading-[1.1] mb-6">
            Questions & Answers
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            Everything you need to know about Reminer and how it can help your research.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div
          className={cn(
            "space-y-3 transition-all duration-700 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className={cn(
                  "group rounded-2xl border transition-all duration-300",
                  isOpen
                    ? "bg-card border-border/80 shadow-card-hover"
                    : "bg-card/60 border-border/50 shadow-card hover:bg-card hover:border-border/70"
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-start justify-between gap-4 p-6 text-left focus-ring rounded-2xl"
                  aria-expanded={isOpen}
                >
                  <span className={cn(
                    "text-base font-semibold leading-relaxed transition-colors duration-200 pr-4",
                    isOpen ? "text-foreground" : "text-foreground/90 group-hover:text-foreground"
                  )}>
                    {faq.question}
                  </span>
                  <span className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300",
                    isOpen
                      ? "bg-foreground text-background"
                      : "bg-secondary text-foreground group-hover:bg-secondary/80"
                  )}>
                    {isOpen ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </span>
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-300",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 -mt-1">
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Contact CTA */}
        <div
          className={cn(
            "mt-14 text-center transition-all duration-700 delay-400",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <p className="text-muted-foreground">
            Still have questions?{" "}
            <a 
              href="mailto:hello@reminer.app" 
              className="text-primary font-semibold hover:underline underline-offset-4 focus-ring rounded"
            >
              Get in touch
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
