/**
 * Database Query Functions
 * Individual queries for database operations
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

/**
 * Get a search by ID
 */
export async function getSearchById(searchId: string, supabase: DbClient) {
  return supabase.from("searches").select("*").eq("id", searchId).single();
}

/**
 * Get search status and error message
 */
export async function getSearchStatus(searchId: string, supabase: DbClient) {
  return supabase
    .from("searches")
    .select("id, status, error_message")
    .eq("id", searchId)
    .single();
}

/**
 * Get search results metadata
 */
export async function getSearchResults(searchId: string, supabase: DbClient) {
  return supabase
    .from("search_results")
    .select("*")
    .eq("search_id", searchId)
    .maybeSingle();
}

/**
 * Get pain points for a search, ordered by severity and mentions
 */
export async function getPainPoints(searchId: string, supabase: DbClient) {
  return supabase
    .from("pain_points")
    .select("*")
    .eq("search_id", searchId)
    .order("severity_score", { ascending: false, nullsFirst: false })
    .order("mentions_count", { ascending: false });
}

/**
 * Get quotes for multiple pain points
 */
export async function getQuotesForPainPoints(
  painPointIds: string[],
  supabase: DbClient
) {
  if (painPointIds.length === 0) {
    return { data: [], error: null };
  }

  return supabase
    .from("pain_point_quotes")
    .select("*")
    .in("pain_point_id", painPointIds)
    .order("upvotes", { ascending: false });
}

/**
 * Get AI analysis for a search
 */
export async function getAiAnalysis(searchId: string, supabase: DbClient) {
  return supabase
    .from("ai_analyses")
    .select("*")
    .eq("search_id", searchId)
    .maybeSingle();
}

/**
 * Check if a similar completed search exists (for deduplication)
 */
export async function findExistingCompletedSearch(
  searchId: string,
  supabase: DbClient
) {
  return supabase
    .from("searches")
    .select("id, status, error_message")
    .eq("id", searchId)
    .single();
}
