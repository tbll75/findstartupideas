/**
 * Gemini Response Parser
 */

import type { GeminiAnalysis } from "../types.ts";

/**
 * Parse Gemini API response text into structured analysis
 */
export function parseGeminiResponse(text: string): Omit<GeminiAnalysis, "model" | "tokensUsed"> | null {
  try {
    // Clean markdown code blocks if present
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      problemClusters: Array.isArray(parsed.problemClusters)
        ? parsed.problemClusters.map(validateProblemCluster).filter(Boolean)
        : [],
      productIdeas: Array.isArray(parsed.productIdeas)
        ? parsed.productIdeas.map(validateProductIdea).filter(Boolean)
        : [],
    };
  } catch (err) {
    console.error("[parseGeminiResponse] Failed to parse Gemini JSON", err);
    console.error("[parseGeminiResponse] Raw response:", text);
    return null;
  }
}

/**
 * Validate and normalize a problem cluster
 */
function validateProblemCluster(cluster: unknown): GeminiAnalysis["problemClusters"][0] | null {
  if (!cluster || typeof cluster !== "object") return null;

  const c = cluster as Record<string, unknown>;

  if (typeof c.title !== "string" || !c.title) return null;
  if (typeof c.description !== "string" || !c.description) return null;

  return {
    title: c.title,
    description: c.description,
    severity: typeof c.severity === "number" ? c.severity : 5,
    mentionCount: typeof c.mentionCount === "number" ? c.mentionCount : 1,
    examples: Array.isArray(c.examples)
      ? c.examples.filter((e): e is string => typeof e === "string")
      : [],
  };
}

/**
 * Validate and normalize a product idea
 */
function validateProductIdea(idea: unknown): GeminiAnalysis["productIdeas"][0] | null {
  if (!idea || typeof idea !== "object") return null;

  const i = idea as Record<string, unknown>;

  if (typeof i.title !== "string" || !i.title) return null;
  if (typeof i.description !== "string" || !i.description) return null;

  return {
    title: i.title,
    description: i.description,
    targetProblem: typeof i.targetProblem === "string" ? i.targetProblem : "",
    impactScore: typeof i.impactScore === "number" ? i.impactScore : 5,
  };
}
