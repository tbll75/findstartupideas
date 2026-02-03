/**
 * Types for Edge Function
 * Mirrors types from the main app for Deno compatibility
 */

// Database Row Types
export type SearchRow = {
  id: string;
  topic: string;
  subreddits: string[] | null;
  time_range: "week" | "month" | "year" | "all" | string;
  min_upvotes: number;
  sort_by: "relevance" | "upvotes" | "recency" | string;
  status: string;
};

export type SearchResultsRow = {
  id: string;
  search_id: string;
  total_mentions: number | null;
  total_posts_considered: number | null;
  total_comments_considered: number | null;
  source_subreddits: string[] | null;
  source_tags?: string[] | null;
};

export type PainPointRow = {
  id: string;
  search_id: string;
  title: string;
  subreddit: string;
  mentions_count: number;
  severity_score: number | null;
};

export type PainPointQuoteRow = {
  id: string;
  pain_point_id: string;
  quote_text: string;
  author_handle: string | null;
  upvotes: number;
  permalink: string;
};

export type AiAnalysisRow = {
  id: string;
  search_id: string;
  summary: string;
  problem_clusters: unknown;
  product_ideas: unknown;
  model: string | null;
  tokens_used: number | null;
};

export type SearchEventRow = {
  id: string;
  search_id: string;
  phase: "stories" | "comments" | "analysis";
  event_type: "story_discovered" | "comment_discovered" | "phase_progress";
  payload: unknown;
  created_at?: string;
};

// API Payload Types
export type SearchResultPayload = {
  searchId: string;
  status: "pending" | "processing" | "completed" | "failed";
  topic: string;
  tags: string[];
  timeRange: "week" | "month" | "year" | "all";
  minUpvotes: number;
  sortBy: "relevance" | "upvotes" | "recency";
  totalMentions?: number;
  totalPostsConsidered?: number;
  totalCommentsConsidered?: number;
  sourceTags?: string[];
  painPoints: {
    id: string;
    searchId: string;
    title: string;
    sourceTag: string;
    mentionsCount: number;
    severityScore?: number;
  }[];
  quotes: {
    id: string;
    painPointId: string;
    quoteText: string;
    authorHandle: string | null;
    upvotes: number;
    permalink: string;
  }[];
  analysis?: {
    summary: string;
    problemClusters: unknown[];
    productIdeas: unknown[];
    model?: string;
    tokensUsed?: number;
  };
};

// HN Types
export type HNSearchParams = {
  topic: string;
  tags: string[];
  timeRange: "week" | "month" | "year" | "all";
  sortBy: "relevance" | "upvotes" | "recency";
  minUpvotes: number;
};

export type HNStory = {
  id: string;
  title: string;
  url: string | null;
  permalink: string;
  text: string | null;
  points: number;
  author: string | null;
  createdAt: number;
  tags: string[];
  numComments: number;
};

export type HNComment = {
  id: string;
  text: string | null;
  points: number;
  author: string | null;
  createdAt: number;
  storyId: string;
  parentId: string | null;
  permalink: string;
};

// Gemini Types
export type GeminiAnalysis = {
  summary: string;
  problemClusters: Array<{
    title: string;
    description: string;
    severity: number;
    mentionCount: number;
    examples: string[];
  }>;
  productIdeas: Array<{
    title: string;
    description: string;
    targetProblem: string;
    impactScore: number;
  }>;
  model?: string;
  tokensUsed?: number;
};
