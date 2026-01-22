import { BarChart3, Clock, Code2, Cpu, FileJson, Lightbulb, Megaphone, Rocket, Search, Share2, Shield, Target, TrendingUp, Zap } from "lucide-react";

export const popularSearches = [
  "Notion",
  "Shopify",
  "Freelance",
  "Remote work",
  "AI tools",
  "Side hustle",
  "SaaS",
  "Productivity",
];

export const navLinks = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#use-cases", label: "Use Cases" },
  { href: "#testimonials", label: "Stories" },
  { href: "#faq", label: "FAQ" },
]

export const trustFeatures = [
  { icon: Zap, text: "Real HackerNews data" },
  { icon: Shield, text: "AI-powered insights" },
  { icon: Clock, text: "5 free searches/day" },
]

export const steps = [
  {
    number: "01",
    icon: Search,
    title: "Enter Your Topic",
    description: "Search any product, tool, or market. From Shopify to AI tools, from freelancing to remote work.",
    gradient: "from-orange-500 to-amber-400",
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI Analyzes Discussions",
    description: "Our AI reads thousands of HackerNews threads to extract genuine pain points from real conversations.",
    gradient: "from-blue-500 to-cyan-400",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
  },
  {
    number: "03",
    icon: Lightbulb,
    title: "Get Actionable Insights",
    description: "Receive prioritized pain points backed by real quotes, engagement metrics, and market signals.",
    gradient: "from-emerald-500 to-teal-400",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
  },
]

export const benefits = [
  "Save 100+ hours of manual research",
  "Find validated product ideas from real users",
  "Discover untapped market opportunities",
  "Build products people actually want",
]


export const useCases = [
  {
    icon: Rocket,
    title: "Founders & Indie Hackers",
    subtitle: "Validate ideas",
    description: "Discover what users hate about your competitors. Find pain points to build your startup around.",
    example: {
      search: "Shopify",
      insight: "Find merchant frustrations to build a better alternative",
    },
    gradient: "from-orange-500 to-amber-500",
    bgGradient: "from-orange-500/8 to-amber-500/4",
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
    accentColor: "text-orange-600",
  },
  {
    icon: BarChart3,
    title: "Product Managers",
    subtitle: "Data-driven roadmaps",
    description: "Validate feature ideas with real user feedback. Understand what's missing in existing tools.",
    example: {
      search: "project management",
      insight: "Discover gaps in tools like Asana, Monday, Notion",
    },
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/8 to-cyan-500/4",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
    accentColor: "text-blue-600",
  },
  {
    icon: Megaphone,
    title: "Marketers",
    subtitle: "Content that resonates",
    description: "Find content angles that connect. Discover the exact problems your audience is discussing.",
    example: {
      search: "email marketing",
      insight: "Uncover pain points for viral blog content",
    },
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/8 to-teal-500/4",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
    accentColor: "text-emerald-600",
  },
  {
    icon: Code2,
    title: "Developers",
    subtitle: "Build tools devs need",
    description: "Find gaps in developer tooling. Build solutions for problems developers are actively discussing.",
    example: {
      search: "Next.js",
      insight: "Find frustrations in the ecosystem to solve",
    },
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-500/8 to-purple-500/4",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-500",
    accentColor: "text-violet-600",
  },
]

export const testimonials = [
  {
    icon: Lightbulb,
    highlight: "I found 5 product ideas in 10 minutes",
    author: "Sarah K.",
    role: "Indie Hacker",
    description: "Searched 'freelance' and discovered pain points about invoicing, client communication, and time tracking that nobody else is solving well.",
    searchTerm: "freelance",
    discoveries: ["Invoicing pain points", "Client communication gaps", "Time tracking frustrations"],
    gradient: "from-orange-500 to-amber-500",
    bgGlow: "oklch(0.70 0.18 40 / 0.15)",
  },
  {
    icon: Target,
    highlight: "Validated my startup idea with real quotes",
    author: "Michael T.",
    role: "Startup Founder",
    description: "Searched 'Notion' and confirmed that users genuinely struggle with speed and offline access. Now I have evidence to support my pitch.",
    searchTerm: "Notion",
    discoveries: ["Speed issues confirmed", "Offline access complaints", "Database performance gaps"],
    gradient: "from-blue-500 to-cyan-500",
    bgGlow: "oklch(0.60 0.15 230 / 0.15)",
  },
  {
    icon: TrendingUp,
    highlight: "Discovered an underserved market",
    author: "Emily R.",
    role: "Product Manager",
    description: "Searched 'no-code tools' and found a massive gap in automation capabilities. This shaped our entire product roadmap.",
    searchTerm: "no-code tools",
    discoveries: ["Automation limitations", "Non-technical user needs", "Integration gaps"],
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "oklch(0.65 0.15 160 / 0.15)",
  },
]


export const faqs = [
  {
    question: "What sources does Reminer search?",
    answer: "Currently HackerNews discussions. We analyze thousands of posts and comments from developers, founders, and tech professionals sharing real product experiences. This gives you access to authentic, unfiltered feedback from people who actually use these products daily.",
  },
  {
    question: "How is this different from manual research?",
    answer: "Manual research takes 10+ hours to read through hundreds of comments. Reminer's AI analyzes everything in 30 seconds and extracts only the actionable insights. You get the same quality of research in a fraction of the time, allowing you to move faster from idea to validation.",
  },
  {
    question: "Can I trust the AI-generated insights?",
    answer: "Absolutely. Every pain point includes direct quotes from real HackerNews users with links to the original discussions. You see the actual evidence, not just AI summaries. This transparency lets you verify any insight and dig deeper when needed.",
  },
  {
    question: "What kind of topics can I search?",
    answer: "Any product, tool, market, or technology discussed on HackerNews: SaaS products (Shopify, Notion), programming tools (Next.js, React), markets (freelancing, remote work), or industries (fintech, edtech). If people are talking about it on HackerNews, you can search for it.",
  },
  {
    question: "How often is the data updated?",
    answer: "We search live HackerNews discussions. Results include posts from the past week, month, or year depending on your filter settings. This means you always get fresh insights from recent conversations.",
  },
  {
    question: "Is there a limit on searches?",
    answer: "Free users get 5 searches per day, which is enough to explore a few ideas. Paid plans offer unlimited searches and advanced filters for power users who need to do extensive market research.",
  },
]

export const features = [
  { icon: Zap, text: "5 free searches/day" },
  { icon: Shield, text: "No credit card required" },
  { icon: Share2, text: "Shareable results" },
]

export const footerLinks = {
  product: [
    { label: "Search", href: "/search" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Use Cases", href: "#use-cases" },
    { label: "Pricing", href: "#" },
  ],
  resources: [
    { label: "Documentation", href: "#" },
    { label: "API", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Changelog", href: "#" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
}

export const socialLinks = [
  {
    name: "Twitter",
    href: "https://twitter.com",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
]