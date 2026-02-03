import {
  BarChart3,
  Clock,
  Code2,
  Cpu,
  Lightbulb,
  Megaphone,
  Rocket,
  Search,
  Share2,
  Shield,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

/**
 * Centralized branding and site configuration
 * All brand-related values should be imported from here
 */

export const SITE_CONFIG = {
  // Brand identity
  name: "Find Startup Ideas",
  shortName: "FSI",
  tagline: "Discover Validated Startup Ideas from Real User Pain Points",

  // Domain configuration
  domain: "findstartupideas.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.findstartupideas.com",

  // SEO metadata
  title: "Find Startup Ideas — Discover Ideas from Real Pain Points",
  description:
    "Find validated startup ideas by analyzing real user pain points from Hacker News discussions. AI-powered startup idea discovery in seconds.",

  // Primary and secondary keywords for SEO
  keywords: [
    "startup ideas",
    "startup idea generator",
    "find startup ideas",
    "validated startup ideas",
    "startup idea validation",
    "pain points",
    "market research",
    "product ideas",
    "indie hacker ideas",
    "SaaS ideas",
    "business ideas",
    "side project ideas",
    "user research tool",
    "competitor analysis",
  ],

  // Social media and OG defaults
  ogImage: "/api/og",
  twitterHandle: "@findstartupideas",

  // Content snippets for reuse
  heroHeadline: "Find Startup Ideas",
  heroSubheadline: "from Real User Pain Points",
  heroDescription:
    "Discover validated startup ideas by analyzing authentic pain points from Hacker News discussions. AI-powered startup idea discovery in seconds.",

  footerDescription:
    "Discover validated startup ideas from real user pain points in Hacker News discussions. Turn authentic conversations into your next business opportunity.",
} as const;

// Type for the site config
export type SiteConfig = typeof SITE_CONFIG;

export const popularSearches = ["Notion", "AI tools", "SaaS", "Productivity"];

export const navLinks = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#use-cases", label: "Use Cases" },
  { href: "#testimonials", label: "Stories" },
  { href: "#faq", label: "FAQ" },
];

export const trustFeatures = [
  { icon: Zap, text: "Real HackerNews data" },
  { icon: Shield, text: "AI-powered insights" },
  { icon: Clock, text: "5 free searches/day" },
];

export const steps = [
  {
    number: "01",
    icon: Search,
    title: "Enter Your Topic",
    description:
      "Search any product, tool, or market. From Shopify to AI tools, from freelancing to remote work.",
    gradient: "from-orange-500 to-amber-400",
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI Analyzes Discussions",
    description:
      "Our AI reads thousands of HackerNews threads to extract genuine pain points and startup opportunities from real conversations.",
    gradient: "from-blue-500 to-cyan-400",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
  },
  {
    number: "03",
    icon: Lightbulb,
    title: "Get Startup Ideas",
    description:
      "Receive validated startup ideas backed by real user pain points, quotes, and market signals.",
    gradient: "from-emerald-500 to-teal-400",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
  },
];

export const benefits = [
  "Save 100+ hours of manual research",
  "Find validated startup ideas from real users",
  "Discover untapped market opportunities",
  "Build startups people actually need",
];

export const useCases = [
  {
    icon: Rocket,
    title: "Founders & Indie Hackers",
    subtitle: "Find startup ideas",
    description:
      "Discover what users hate about existing products. Find validated startup ideas backed by real pain points.",
    example: {
      search: "Shopify",
      insight: "Find merchant frustrations to build your next startup",
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
    description:
      "Validate feature ideas with real user feedback. Find startup opportunities in existing tool gaps.",
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
    description:
      "Find content angles that connect. Discover startup ideas your audience is actively seeking.",
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
    description:
      "Find gaps in developer tooling. Discover startup ideas for problems developers are actively discussing.",
    example: {
      search: "Next.js",
      insight: "Find frustrations in the ecosystem to solve",
    },
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-500/8 to-purple-500/4",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-500",
    accentColor: "text-violet-600",
  },
];

export const testimonials = [
  {
    icon: Lightbulb,
    highlight: "I found 5 startup ideas in 10 minutes",
    author: "Sarah K.",
    role: "Indie Hacker",
    description:
      "Searched 'freelance' and discovered startup ideas around invoicing, client communication, and time tracking that nobody else is solving well.",
    searchTerm: "freelance",
    discoveries: [
      "Invoicing startup idea",
      "Client communication gaps",
      "Time tracking opportunities",
    ],
    gradient: "from-orange-500 to-amber-500",
    bgGlow: "oklch(0.70 0.18 40 / 0.15)",
  },
  {
    icon: Target,
    highlight: "Validated my startup idea with real quotes",
    author: "Michael T.",
    role: "Startup Founder",
    description:
      "Searched 'Notion' and confirmed that users genuinely struggle with speed and offline access. Now I have evidence to support my pitch.",
    searchTerm: "Notion",
    discoveries: [
      "Speed issues confirmed",
      "Offline access complaints",
      "Database performance gaps",
    ],
    gradient: "from-blue-500 to-cyan-500",
    bgGlow: "oklch(0.60 0.15 230 / 0.15)",
  },
  {
    icon: TrendingUp,
    highlight: "Discovered an underserved startup opportunity",
    author: "Emily R.",
    role: "Product Manager",
    description:
      "Searched 'no-code tools' and found a massive gap in automation capabilities. This shaped our entire product roadmap and startup direction.",
    searchTerm: "no-code tools",
    discoveries: [
      "Automation limitations",
      "Non-technical user needs",
      "Integration gaps",
    ],
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "oklch(0.65 0.15 160 / 0.15)",
  },
];

export const faqs = [
  {
    question: "What sources does Find Startup Ideas search?",
    answer:
      "Currently HackerNews discussions. We analyze thousands of posts and comments from developers, founders, and tech professionals sharing real product experiences. This gives you access to authentic, unfiltered feedback from people who actually use these products daily — perfect for finding validated startup ideas.",
  },
  {
    question: "How is this different from manual research?",
    answer:
      "Manual research takes 10+ hours to read through hundreds of comments. Our AI analyzes everything in 30 seconds and extracts only the actionable startup ideas and pain points. You get the same quality of research in a fraction of the time, allowing you to move faster from idea to validation.",
  },
  {
    question: "Can I trust the AI-generated startup ideas?",
    answer:
      "Absolutely. Every startup idea and pain point includes direct quotes from real HackerNews users with links to the original discussions. You see the actual evidence, not just AI summaries. This transparency lets you verify any insight and dig deeper when needed.",
  },
  {
    question: "What kind of topics can I search for startup ideas?",
    answer:
      "Any product, tool, market, or technology discussed on HackerNews: SaaS products (Shopify, Notion), programming tools (Next.js, React), markets (freelancing, remote work), or industries (fintech, edtech). If people are talking about it on HackerNews, you can find startup ideas around it.",
  },
  {
    question: "How often is the startup idea data updated?",
    answer:
      "We search live HackerNews discussions. Results include posts from the past week, month, or year depending on your filter settings. This means you always get fresh startup ideas from recent conversations.",
  },
  {
    question: "Is there a limit on searches?",
    answer:
      "Free users get 15 searches per day, which is enough to explore a few startup ideas.",
  },
];

export const features = [
  { icon: Zap, text: "15 free searches/day" },
  { icon: Shield, text: "No credit card required" },
  { icon: Share2, text: "Shareable results" },
];
