import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type SupabaseDatabase = any;

let cachedClient: SupabaseClient<SupabaseDatabase> | null = null;

export function getSupabaseServiceClient(): SupabaseClient<SupabaseDatabase> {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  cachedClient = createClient<SupabaseDatabase>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  return cachedClient;
}
