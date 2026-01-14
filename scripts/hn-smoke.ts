import { buildSearchKey } from "@/lib/cache";
import {
  SearchRequestSchema,
  SearchResultSchema,
  hnTagsEnum,
} from "@/lib/validation";

async function main() {
  const request = SearchRequestSchema.parse({
    topic: "database scalability",
    tags: [hnTagsEnum.enum.ask_hn],
    timeRange: "month",
    minUpvotes: 10,
    sortBy: "relevance",
  });

  const searchKey = buildSearchKey(request);
  if (!searchKey.startsWith("searchKey:")) {
    throw new Error("searchKey generation failed");
  }

  const sampleResult = {
    searchId: crypto.randomUUID(),
    status: "completed",
    topic: request.topic,
    tags: request.tags,
    timeRange: request.timeRange,
    minUpvotes: request.minUpvotes,
    sortBy: request.sortBy,
    totalMentions: 12,
    totalPostsConsidered: 4,
    totalCommentsConsidered: 20,
    sourceTags: ["ask_hn"],
    painPoints: [
      {
        id: crypto.randomUUID(),
        searchId: crypto.randomUUID(),
        title: "Scaling concerns in Ask HN threads",
        sourceTag: "ask_hn",
        mentionsCount: 4,
      },
    ],
    quotes: [
      {
        id: crypto.randomUUID(),
        painPointId: crypto.randomUUID(),
        quoteText: "We hit a wall at 10k TPS without sharding.",
        authorHandle: "hn_user",
        upvotes: 42,
        permalink: "https://news.ycombinator.com/item?id=1",
      },
    ],
    analysis: {
      summary: "Users worry about scaling database writes and costs.",
      problemClusters: [],
      productIdeas: [],
    },
  };

  const validated = SearchResultSchema.parse(sampleResult);
  console.log("✓ SearchRequest and SearchResult schemas validated");
  console.log("searchKey:", searchKey);
  console.log("sampleResult.tags:", validated.tags);
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
