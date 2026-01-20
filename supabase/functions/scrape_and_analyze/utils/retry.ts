/**
 * Retry Utilities
 * Exponential backoff retry logic
 */

/**
 * Execute a function with exponential backoff retry
 *
 * @param fn - Async function to execute
 * @param maxRetries - Maximum number of retry attempts
 * @param delayMs - Initial delay between retries
 * @param context - Context string for logging
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  context = "operation"
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const backoff = delayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[${context}] Attempt ${attempt}/${maxRetries} failed, retrying in ${backoff}ms...`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
  throw new Error("Retry failed");
}

/**
 * Sleep for a specified duration
 * @param ms - Duration in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
