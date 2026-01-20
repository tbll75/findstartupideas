/**
 * Gemini AI Client
 * Calls Google Gemini API for pain point analysis
 */

import type { HNStory, HNComment, GeminiAnalysis } from "../types.ts";
import {
  GEMINI_API_KEY,
  GEMINI_MODEL,
  GEMINI_MAX_STORIES,
  GEMINI_MAX_COMMENTS_PER_STORY,
  GEMINI_SNIPPET_MAX_LENGTH,
  GEMINI_COMMENT_MAX_LENGTH,
} from "../config.ts";
import { stripHtml } from "../utils/html.ts";
import { pickPrimaryTag } from "../hn/utils.ts";
import { buildPrompt } from "./prompts.ts";
import { parseGeminiResponse } from "./parser.ts";

/**
 * Call Gemini API for analysis
 */
export async function callGeminiForAnalysis(input: {
  topic: string;
  stories: HNStory[];
  comments: Map<string, HNComment[]>;
}): Promise<GeminiAnalysis | null> {
  if (!GEMINI_API_KEY) {
    console.warn("[callGeminiForAnalysis] GEMINI_API_KEY not configured");
    return null;
  }

  // Prepare data for Gemini
  const trimmedItems = input.stories.slice(0, GEMINI_MAX_STORIES).map((story) => {
    const cs = input.comments.get(story.id) ?? [];
    const commentSnippets = cs
      .slice(0, GEMINI_MAX_COMMENTS_PER_STORY)
      .map((c) => stripHtml(c.text ?? "").slice(0, GEMINI_COMMENT_MAX_LENGTH));

    return {
      tag: pickPrimaryTag(story),
      title: story.title,
      snippet: stripHtml(story.text ?? "").slice(0, GEMINI_SNIPPET_MAX_LENGTH),
      upvotes: story.points,
      commentSnippets,
      url: story.url,
    };
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_MODEL
  )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const prompt = buildPrompt(input.topic, trimmedItems);

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[callGeminiForAnalysis] Gemini error", res.status, text);
    return null;
  }

  const json = await res.json();
  const candidates = json?.candidates ?? [];
  const text = candidates[0]?.content?.parts?.[0]?.text ?? "";

  if (!text) {
    console.error("[callGeminiForAnalysis] No text in Gemini response");
    return null;
  }

  const parsed = parseGeminiResponse(text);
  if (!parsed) return null;

  return {
    ...parsed,
    model: GEMINI_MODEL,
    tokensUsed: json?.usageMetadata?.totalTokenCount,
  };
}
