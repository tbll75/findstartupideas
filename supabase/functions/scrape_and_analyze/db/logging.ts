/**
 * Job Logging
 * Structured logging to database for observability
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Log job event to database
 */
export async function logJob(
  supabase: SupabaseClient,
  searchId: string | null,
  level: "info" | "error" | "warn",
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("job_logs").insert({
      search_id: searchId,
      level,
      message,
      context: context ?? null,
    });
  } catch (err) {
    console.error("[logJob] Failed to log", err);
  }
}

/**
 * Create a scoped logger for a specific search
 */
export function createSearchLogger(
  supabase: SupabaseClient,
  searchId: string
) {
  return {
    info: (message: string, context?: Record<string, unknown>) =>
      logJob(supabase, searchId, "info", message, context),
    error: (message: string, context?: Record<string, unknown>) =>
      logJob(supabase, searchId, "error", message, context),
    warn: (message: string, context?: Record<string, unknown>) =>
      logJob(supabase, searchId, "warn", message, context),
  };
}
