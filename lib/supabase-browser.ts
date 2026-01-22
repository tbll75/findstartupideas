"use client";

import { createClient } from "@supabase/supabase-js";

// Small wrapper to create a singleton browser Supabase client using the anon key.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast in development; in production this will surface as a runtime error.
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase-browser] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabaseBrowserClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
    },
  }
);

