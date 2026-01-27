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
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://findstartupideas.com",
  
  // SEO metadata
  title: "Find Startup Ideas — Discover Ideas from Real Pain Points",
  description: "Find validated startup ideas by analyzing real user pain points from Hacker News discussions. AI-powered startup idea discovery in seconds.",
  
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
  heroDescription: "Discover validated startup ideas by analyzing authentic pain points from Hacker News discussions. AI-powered startup idea discovery in seconds.",
  
  footerDescription: "Discover validated startup ideas from real user pain points in Hacker News discussions. Turn authentic conversations into your next business opportunity.",
} as const;

// Type for the site config
export type SiteConfig = typeof SITE_CONFIG;
