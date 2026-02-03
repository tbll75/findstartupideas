/**
 * Edge Function Utilities
 * Helpers for invoking the scrape_and_analyze edge function
 */

/**
 * Trigger the scrape_and_analyze edge function
 * Fire-and-forget: Returns immediately after sending the request
 * The edge function runs asynchronously and emits events via Realtime
 *
 * @param searchId - UUID of the search to process
 * @returns True if the request was sent successfully
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
    const controller = new AbortController();

    const connectionTimeout = setTimeout(() => controller.abort(), 5000);

    fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ searchId }),
      signal: controller.signal,
    })
      .then((response) => {
        clearTimeout(connectionTimeout);
        if (!response.ok) {
          console.warn(
            `[triggerEdgeFunction] Edge function returned ${response.status} for ${searchId}`
          );
        }
      })
      .catch((err) => {
        clearTimeout(connectionTimeout);
        if (err.name === "AbortError") {
          console.log(
            `[triggerEdgeFunction] Connection timeout for ${searchId} (edge function may still be running)`
          );
        } else {
          console.error(
            `[triggerEdgeFunction] Async invocation error for ${searchId}:`,
            err.message
          );
        }
      });

    return true;
  } catch (err) {
    console.error("[triggerEdgeFunction] Failed to invoke edge function", err);
    return false;
  }
}
