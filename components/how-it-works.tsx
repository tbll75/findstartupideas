"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { steps, benefits } from "@/constants"

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [progressWidth, setProgressWidth] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.15 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    setProgressWidth(0)
    const progressInterval = setInterval(() => {
      setProgressWidth((prev) => {
        if (prev >= 100) return 100
        return prev + 2
      })
    }, 80)

    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
      setProgressWidth(0)
    }, 5000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(stepInterval)
    }
  }, [activeStep, isVisible])

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative py-28 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 via-secondary/25 to-background" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      {/* Decorative orb */}
      <div 
        className="absolute top-20 right-[5%] w-[350px] h-[350px] rounded-full opacity-25 animate-float-slow pointer-events-none"
        style={{
          background: "radial-gradient(circle, oklch(0.60 0.21 30 / 0.12) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
        {/* Section Header */}
        <div
          className={cn(
            "max-w-3xl mx-auto text-center mb-20 lg:mb-24 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-card border border-border/50 text-sm font-medium text-muted-foreground mb-8 shadow-card">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>How It Works</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] tracking-[-0.02em] text-balance leading-[1.1] mb-6">
            From keyword to insights
            <br />
            <span className="text-muted-foreground">in 30 seconds</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            No more endless scrolling through forums. Let AI do the heavy lifting while you focus on building.
          </p>
        </div>

        {/* Steps */}
        <div
          className={cn(
            "grid lg:grid-cols-3 gap-5 lg:gap-6 mb-20 lg:mb-24 transition-all duration-700 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = activeStep === index
            return (
              <div
                key={step.number}
                onMouseEnter={() => {
                  setActiveStep(index)
                  setProgressWidth(0)
                }}
                className={cn(
                  "group relative rounded-3xl p-8 lg:p-9 transition-all duration-400 cursor-pointer",
                  "bg-card border",
                  isActive
                    ? "border-border shadow-card-hover scale-[1.01]"
                    : "border-border/50 shadow-card hover:shadow-card-hover hover:border-border/80"
                )}
              >
                {/* Progress bar */}
                <div className="absolute top-0 left-1 right-1 h-2 rounded-t-4xl overflow-hidden bg-border/30">
                  <div 
                    className={cn(
                      "h-full transition-all duration-100 ease-linear",
                      `bg-gradient-to-r ${step.gradient}`,
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                    style={{ width: isActive ? `${progressWidth}%` : "0%" }}
                  />
                </div>

                {/* Step number watermark */}
                <span className={cn(
                  "absolute top-6 right-6 text-7xl font-serif font-medium leading-none transition-colors duration-400",
                  isActive ? "text-primary/8" : "text-border/60"
                )}>
                  {step.number}
                </span>

                {/* Icon */}
                <div
                  className={cn(
                    "relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center mb-7 transition-all duration-400",
                    isActive 
                      ? `${step.iconBg} shadow-elevation-2` 
                      : "bg-secondary/80 group-hover:bg-secondary"
                  )}
                >
                  <Icon className={cn(
                    "w-6 h-6 transition-colors duration-400",
                    isActive ? "text-white" : "text-foreground"
                  )} />
                </div>

                {/* Content */}
                <h3 className="relative z-10 text-xl font-semibold mb-3 text-foreground">
                  {step.title}
                </h3>
                <p className="relative z-10 text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Connector arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-20">
                    <div className={cn(
                      "w-6 h-6 rounded-full bg-card border flex items-center justify-center transition-all duration-300",
                      isActive ? "border-primary/50 shadow-sm" : "border-border"
                    )}>
                      <ArrowRight className={cn(
                        "w-3 h-3 transition-colors duration-300",
                        isActive ? "text-primary" : "text-muted-foreground/60"
                      )} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Step indicators (mobile) */}
        <div className="flex justify-center gap-2 mb-16 lg:hidden">
          {steps.map((step, index) => (
            <button
              type="button"
              key={index}
              onClick={() => {
                setActiveStep(index)
                setProgressWidth(0)
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                activeStep === index 
                  ? `w-8 bg-gradient-to-r ${step.gradient}` 
                  : "w-1.5 bg-border hover:bg-muted-foreground/30"
              )}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Benefits Card */}
        <div
          className={cn(
            "max-w-2xl mx-auto transition-all duration-700 delay-400",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="relative bg-card rounded-3xl border border-border/50 p-9 shadow-card overflow-hidden">
            {/* Subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.015] to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <h3 className="text-center font-semibold text-muted-foreground uppercase tracking-wider mb-8">
                What you get with Reminer
              </h3>
              <div className="grid justify-center">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-3 rounded-xl hover:bg-secondary/40 transition-colors duration-200"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-foreground font-medium leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
