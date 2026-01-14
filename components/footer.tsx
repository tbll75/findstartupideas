import { Logo } from "@/components/logo"
import { Github, Twitter, Linkedin, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function Footer() {
  return (
    <footer className="relative border-t border-border/50 overflow-hidden">
      {/* Multi-layered background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card via-card to-secondary/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(234,88,12,0.02),transparent_70%)]" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-5 text-sm text-muted-foreground max-w-sm leading-relaxed">
              Transform Reddit conversations into actionable market insights. Discover pain points, validate ideas, and
              build products people actually want.
            </p>
            <div className="flex items-center gap-2 mt-8">
              {[
                { icon: Twitter, label: "Twitter" },
                { icon: Github, label: "GitHub" },
                { icon: Linkedin, label: "LinkedIn" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    "bg-secondary/80 text-muted-foreground",
                    "hover:bg-foreground hover:text-background",
                    "transition-all duration-300 hover:-translate-y-0.5",
                    "relative overflow-hidden group",
                  )}
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  aria-label={label}
                >
                  <Icon className="w-4 h-4 relative z-10" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold mb-5 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-primary" />
              Product
            </h4>
            <ul className="space-y-3">
              {["Features", "Pricing", "API", "Integrations"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="group text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 inline-flex items-center gap-1"
                  >
                    {item}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-5 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-primary" />
              Company
            </h4>
            <ul className="space-y-3">
              {["About", "Blog", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="group text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 inline-flex items-center gap-1"
                  >
                    {item}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}
        >
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Reminer. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
