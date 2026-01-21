"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { footerLinks, socialLinks } from "@/constants"

export function Footer() {
  const [email, setEmail] = useState("")

  return (
    <footer className="relative bg-background">
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        {/* Main content */}
        <div className="py-14 lg:py-18 grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group focus-ring rounded-lg">
              <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center transition-shadow duration-300 group-hover:shadow-elevation-1">
                <span className="text-background font-serif text-lg font-semibold">R</span>
              </div>
              <span className="font-serif text-xl font-medium text-foreground tracking-tight">Reminer</span>
            </Link>
            <p className="text-muted-foreground leading-relaxed max-w-sm mb-7 text-[15px]">
              Discover real user pain points from HackerNews discussions. Turn authentic conversations into validated product opportunities.
            </p>
            
            {/* Newsletter */}
            <div className="max-w-sm">
              <p className="text-sm font-medium text-foreground mb-3">Stay updated</p>
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  setEmail("")
                }} 
                className="flex gap-2"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={cn(
                    "flex-1 h-10 px-4 rounded-xl text-sm",
                    "bg-secondary border border-border/50",
                    "placeholder:text-muted-foreground/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40",
                    "transition-all duration-200"
                  )}
                />
                <button
                  type="submit"
                  className={cn(
                    "h-10 px-5 rounded-xl text-sm font-semibold",
                    "bg-foreground text-background",
                    "hover:shadow-elevation-1 transition-all duration-200 btn-press"
                  )}
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-[13px] font-semibold text-foreground mb-4 uppercase tracking-wider">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-[15px] focus-ring rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources links */}
          <div>
            <h3 className="text-[13px] font-semibold text-foreground mb-4 uppercase tracking-wider">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-[15px] focus-ring rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-[13px] font-semibold text-foreground mb-4 uppercase tracking-wider">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-[15px] focus-ring rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-7 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Reminer. All rights reserved.</p>
            <span className="hidden sm:block w-1 h-1 rounded-full bg-border" />
            <p>Made with care for builders everywhere</p>
          </div>
          <div className="flex items-center gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-secondary",
                  "transition-all duration-200 focus-ring"
                )}
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
