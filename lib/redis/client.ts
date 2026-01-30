/**
 * Redis Client
 * Low-level Redis operations using Upstash REST API
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return Boolean(REDIS_URL && REDIS_TOKEN);
}

if (!isRedisConfigured()) {
  console.warn(
    "[redis/client] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN env vars. Redis features will be disabled."
  );
}

/**
 * Result from a Redis command
 */
export type RedisCommandResult<T = unknown> = {
  result: T | null;
  error?: string;
};

/**
 * Execute a Redis command via Upstash REST API
 * Uses POST with JSON body to avoid URL length limits
 *
 * @param command - Redis command (e.g., "GET", "SET", "INCR")
 * @param args - Command arguments
 * @returns Command result or error
 */
export async function redisCommand<T = unknown>(
  command: string,
  ...args: (string | number)[]
): Promise<RedisCommandResult<T>> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return { result: null, error: "Redis not configured" };
  }

  try {
    const res = await fetch(REDIS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([command, ...args]),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[redisCommand] ${command} failed: ${res.status} ${text}`);
      return {
        result: null,
        error: `Redis request failed with ${res.status}: ${text}`,
      };
    }

    const json = (await res.json().catch(() => null)) as { result: T } | null;

    if (!json || typeof json.result === "undefined") {
      console.error(`[redisCommand] ${command} returned malformed response`);
      return { result: null, error: "Malformed Redis response" };
    }

    return { result: json.result };
  } catch (error) {
    console.error(`[redisCommand] ${command} threw error:`, error);
    return {
      result: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get a string value from Redis
 * @param key - Redis key
 * @returns Value or null
 */
export async function redisGet(key: string): Promise<string | null> {
  const { result, error } = await redisCommand<string>("GET", key);
  if (error) {
    console.error(`[redisGet] Failed for key ${key}:`, error);
  }
  return (result as string | null) ?? null;
}

/**
 * Set a string value in Redis with optional TTL
 * @param key - Redis key
 * @param value - Value to set
 * @param ttlSeconds - Optional TTL in seconds
 * @returns True if successful
 */
export async function redisSet(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<boolean> {
  const args: (string | number)[] = [key, value];
  if (typeof ttlSeconds === "number" && ttlSeconds > 0) {
    args.push("EX", ttlSeconds);
  }

  const { result, error } = await redisCommand<"OK">("SET", ...args);
  if (error) {
    console.error(`[redisSet] Failed for key ${key}:`, error);
  }
  return result === "OK";
}

/**
 * Set a value only if the key does not exist (with TTL)
 * @param key - Redis key
 * @param value - Value to set
 * @param ttlSeconds - TTL in seconds
 * @returns True if key was set, false if key already exists
 */
export async function redisSetNX(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<boolean> {
  const { result, error } = await redisCommand<"OK" | null>(
    "SET",
    key,
    value,
    "NX",
    "EX",
    ttlSeconds
  );
  if (error) {
    console.error(`[redisSetNX] Failed for key ${key}:`, error);
    return false;
  }
  return result === "OK";
}

/**
 * Delete a key from Redis
 * @param key - Redis key
 * @returns Number of keys deleted
 */
export async function redisDel(key: string): Promise<number> {
  const { result, error } = await redisCommand<number>("DEL", key);
  if (error) {
    console.error(`[redisDel] Failed for key ${key}:`, error);
  }
  return typeof result === "number" ? result : 0;
}

/**
 * Increment a value in Redis
 * @param key - Redis key
 * @returns New value after increment, or NaN on error
 */
export async function redisIncr(key: string): Promise<number> {
  const { result, error } = await redisCommand<number>("INCR", key);
  if (error) {
    console.error(`[redisIncr] Failed for key ${key}:`, error);
    return NaN;
  }
  return typeof result === "number" ? result : NaN;
}

/**
 * Set TTL on a key
 * @param key - Redis key
 * @param seconds - TTL in seconds
 * @returns True if TTL was set
 */
export async function redisExpire(
  key: string,
  seconds: number
): Promise<boolean> {
  const { result, error } = await redisCommand<number>("EXPIRE", key, seconds);
  if (error) {
    console.error(`[redisExpire] Failed for key ${key}:`, error);
  }
  return result === 1;
}

/**
 * Get TTL of a key
 * @param key - Redis key
 * @returns TTL in seconds, -1 if no TTL, -2 if key doesn't exist
 */
export async function redisTTL(key: string): Promise<number> {
  const { result, error } = await redisCommand<number>("TTL", key);
  if (error) {
    console.error(`[redisTTL] Failed for key ${key}:`, error);
    return -2;
  }
  return typeof result === "number" ? result : -2;
}
