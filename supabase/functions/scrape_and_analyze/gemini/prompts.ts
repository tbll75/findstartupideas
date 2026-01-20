/**
 * Gemini Prompt Templates
 */

interface StoryItem {
  tag: string;
  title: string;
  snippet: string;
  upvotes: number;
  commentSnippets: string[];
  url: string | null;
}

/**
 * Build the analysis prompt for Gemini
 */
export function buildPrompt(topic: string, items: StoryItem[]): string {
  return `Analyze these Hacker News discussions about "${topic}".

Identify the top 3-7 pain point themes and generate product ideas.

Return ONLY valid JSON (no markdown, no backticks) in this EXACT format:

{
  "summary": "2-3 sentence overview of main themes",
  "problemClusters": [
    {
      "title": "Pain point title",
      "description": "1-2 sentence description",
      "severity": 7,
      "mentionCount": 12,
      "examples": ["Quote from user 1", "Quote from user 2"]
    }
  ],
  "productIdeas": [
    {
      "title": "Product idea name",
      "description": "What it does and why it solves the pain",
      "targetProblem": "Which pain point title it addresses",
      "impactScore": 8
    }
  ]
}

Important:
- Identify distinct pain themes, not just categories
- Include real quotes in the examples array (2-5 per cluster)
- Severity is 1-10 (10 = most severe)
- Impact score is 1-10 (10 = highest impact)

Data to analyze:
${JSON.stringify(items, null, 2)}`;
}
