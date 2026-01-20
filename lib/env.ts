/**
 * Environment Variable Validation
 * Validates and provides typed access to environment variables
 */

import { z } from "zod";

/**
 * Schema for required environment variables
 */
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z
    .string()
    .min(1, "Supabase publishable key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "Supabase service role key is required"),

  // Redis (Upstash)
  UPSTASH_REDIS_REST_URL: z.string().url("Invalid Redis URL"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "Redis token is required"),

  // Gemini (optional - can be set on edge function)
  GEMINI_API_KEY: z.string().optional(),

  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Schema for public (client-side) environment variables
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z
    .string()
    .min(1, "Supabase publishable key is required"),
});

export type Env = z.infer<typeof envSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

/**
 * Validate and parse environment variables
 * Throws on invalid configuration
 */
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, msgs]) => `  ${field}: ${msgs?.join(", ")}`)
      .join("\n");

    console.error("Environment validation failed:\n" + errorMessages);

    // In development, warn but don't crash
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Running in development mode with missing env vars. Some features may not work."
      );
      return process.env as unknown as Env;
    }

    throw new Error(`Invalid environment configuration:\n${errorMessages}`);
  }

  return parsed.data;
}

/**
 * Validate public environment variables (safe for client-side)
 */
function validatePublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  });

  if (!parsed.success) {
    throw new Error("Invalid public environment configuration");
  }

  return parsed.data;
}

/**
 * Validated environment variables
 * Access these instead of process.env directly
 */
export const env = validateEnv();

/**
 * Public environment variables (safe for client-side)
 */
export const publicEnv = validatePublicEnv();

/**
 * Check if we're in production
 */
export const isProduction = env.NODE_ENV === "production";

/**
 * Check if we're in development
 */
export const isDevelopment = env.NODE_ENV === "development";

/**
 * Check if a feature is available based on env vars
 */
export const features = {
  redis: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
  gemini: Boolean(env.GEMINI_API_KEY),
};
