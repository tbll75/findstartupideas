/**
 * Database Operations
 * Supabase CRUD operations for the edge function
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type {
  SearchRow,
  SearchResultsRow,
  PainPointRow,
  PainPointQuoteRow,
  AiAnalysisRow,
} from "../types.ts";

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Update search status
 */
export async function updateSearchStatus(
  supabase: SupabaseClient,
  searchId: string,
  status: "pending" | "processing" | "completed" | "failed",
  errorMessage?: string
): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (status === "completed") {
    update.completed_at = new Date().toISOString();
  }
  if (errorMessage) {
    update.error_message = errorMessage;
  }

  const { error } = await supabase
    .from("searches")
    .update(update)
    .eq("id", searchId);

  if (error) {
    console.error("[updateSearchStatus] Failed to update", error);
  }
}

/**
 * Get search by ID
 */
export async function getSearch(
  supabase: SupabaseClient,
  searchId: string
): Promise<{ data: SearchRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("searches")
    .select("*")
    .eq("id", searchId)
    .single<SearchRow>();

  return { data, error: error as Error | null };
}

/**
 * Check if search results already exist
 */
export async function getExistingResults(
  supabase: SupabaseClient,
  searchId: string
): Promise<SearchResultsRow | null> {
  const { data } = await supabase
    .from("search_results")
    .select("*")
    .eq("search_id", searchId)
    .maybeSingle<SearchResultsRow>();

  return data;
}

/**
 * Insert search results metadata
 */
export async function insertSearchResults(
  supabase: SupabaseClient,
  data: Omit<SearchResultsRow, "id">
): Promise<SearchResultsRow | null> {
  const { data: result, error } = await supabase
    .from("search_results")
    .insert(data)
    .select("*")
    .single<SearchResultsRow>();

  if (error) {
    console.error("[insertSearchResults] Failed to insert", error);
    return null;
  }

  return result;
}

/**
 * Insert pain points
 */
export async function insertPainPoints(
  supabase: SupabaseClient,
  painPoints: Omit<PainPointRow, "">[]
): Promise<void> {
  if (painPoints.length === 0) return;

  const { error } = await supabase.from("pain_points").insert(painPoints);

  if (error) {
    throw new Error(`Failed to insert pain_points: ${error.message}`);
  }
}

/**
 * Get persisted pain points for a search
 */
export async function getPainPoints(
  supabase: SupabaseClient,
  searchId: string
): Promise<PainPointRow[]> {
  const { data } = await supabase
    .from("pain_points")
    .select("*")
    .eq("search_id", searchId);

  return (data as PainPointRow[]) || [];
}

/**
 * Insert quotes
 */
export async function insertQuotes(
  supabase: SupabaseClient,
  quotes: Omit<PainPointQuoteRow, "">[]
): Promise<void> {
  if (quotes.length === 0) return;

  const { error } = await supabase.from("pain_point_quotes").insert(quotes);

  if (error) {
    throw new Error(`Failed to insert pain_point_quotes: ${error.message}`);
  }
}

/**
 * Insert AI analysis
 */
export async function insertAiAnalysis(
  supabase: SupabaseClient,
  data: Omit<AiAnalysisRow, "id">
): Promise<AiAnalysisRow | null> {
  const { data: result, error } = await supabase
    .from("ai_analyses")
    .insert(data)
    .select("*");

  if (error) {
    console.error("[insertAiAnalysis] Insert failed", error);
    return null;
  }

  return Array.isArray(result) && result[0] ? (result[0] as AiAnalysisRow) : null;
}

/**
 * Track API usage
 */
export async function trackApiUsage(
  supabase: SupabaseClient,
  searchId: string,
  service: string,
  tokensUsed: number,
  costPerMillion: number
): Promise<void> {
  try {
    const estimatedCost = (tokensUsed / 1_000_000) * costPerMillion;

    await supabase.from("api_usage").insert({
      search_id: searchId,
      service,
      tokens_used: tokensUsed,
      estimated_cost_usd: estimatedCost,
    });
  } catch (err) {
    console.error("[trackApiUsage] Failed to track usage", err);
  }
}
