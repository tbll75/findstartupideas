/**
 * Edge Function Utilities
 * Helpers for invoking the scrape_and_analyze edge function
 */

import { EDGE_FUNCTION_TRIGGER_TIMEOUT_MS } from "@/shared/constants";

/**
 * Trigger the scrape_and_analyze edge function
 * Returns true if successfully triggered (doesn't wait for completion)
 *
 * @param searchId - UUID of the search to process
 * @returns True if successfully triggered
 */
export async function triggerEdgeFunction(searchId: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[triggerEdgeFunction] Missing Supabase configuration");
    return false;
  }

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/scrape_and_analyze`;

  try {
    // Fire and forget - don't wait for completion
    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ searchId }),
      // Don't wait forever for edge function
      signal: AbortSignal.timeout(EDGE_FUNCTION_TRIGGER_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(
        `[triggerEdgeFunction] Edge function returned ${response.status}`
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error("[triggerEdgeFunction] Failed to invoke edge function", err);
    return false;
  }
}
