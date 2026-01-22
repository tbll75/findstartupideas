"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { navLinks } from "@/constants"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)

      const sections = navLinks.map(link => link.href.replace("#", ""))
      for (const section of sections.reverse()) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 120) {
            setActiveSection(section)
            break
          }
        }
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
        isScrolled ? "py-3" : "py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <nav
          className={cn(
            "flex items-center justify-between h-14 lg:h-[60px] px-4 lg:px-6 rounded-2xl transition-all duration-500 ease-out",
            isScrolled
              ? "glass border border-border/40 shadow-elevation-2"
              : "bg-transparent"
          )}
        >
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2.5 group focus-ring rounded-lg -ml-1 pl-1"
          >
            <div className="relative">
              <div className={cn(
                "w-9 h-9 rounded-xl bg-foreground flex items-center justify-center transition-all duration-300",
                "group-hover:scale-105 group-hover:shadow-elevation-2"
              )}>
                <span className="text-background font-serif text-lg font-semibold">R</span>
              </div>
            </div>
            <span className="font-serif text-xl font-medium text-foreground tracking-tight">
              Reminer
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = activeSection === link.href.replace("#", "")
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 text-[14px] font-medium rounded-lg transition-all duration-300 focus-ring",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                  <span 
                    className={cn(
                      "absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary transition-all duration-300",
                      isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
                    )} 
                  />
                </a>
              )
            })}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/search">
              <Button
                size="sm"
                className={cn(
                  "cursor-pointer h-10 px-5 bg-foreground text-background font-medium rounded-xl text-[14px]",
                  "shadow-elevation-1 hover:shadow-elevation-2",
                  "transition-all duration-300 btn-press shimmer-hover group"
                )}
              >
                <span className="flex items-center gap-2">
                  Start Free
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                </span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              "lg:hidden relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 focus-ring",
              isMobileMenuOpen ? "bg-secondary" : "hover:bg-secondary/70"
            )}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <div className="relative w-5 h-4 flex flex-col justify-between">
              <span
                className={cn(
                  "block h-0.5 bg-foreground rounded-full transition-all duration-300 origin-center",
                  isMobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""
                )}
              />
              <span
                className={cn(
                  "block h-0.5 bg-foreground rounded-full transition-all duration-300",
                  isMobileMenuOpen ? "opacity-0 scale-x-0" : ""
                )}
              />
              <span
                className={cn(
                  "block h-0.5 bg-foreground rounded-full transition-all duration-300 origin-center",
                  isMobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""
                )}
              />
            </div>
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden absolute top-full left-0 right-0 px-5 transition-all duration-400 ease-out overflow-hidden",
          isMobileMenuOpen ? "max-h-[400px] opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"
        )}
      >
        <div className="glass border border-border/40 rounded-2xl shadow-elevation-3 p-2 overflow-hidden">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center py-3.5 px-4 rounded-xl text-[15px] font-medium transition-colors duration-200",
                  "text-foreground/80 hover:text-foreground hover:bg-secondary/60 active:bg-secondary"
                )}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="p-2 pt-3 mt-2 border-t border-border/40">
            <Link href="/search" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full h-12 bg-foreground text-background font-semibold rounded-xl shadow-elevation-1">
                Start Searching Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
