/**
 * services/crawler/fetch-with-retry.ts
 *
 * Exponential Backoff HTTP Retry System (Phase 4A.5).
 * Retries failed page fetch requests up to maxRetries times with exponential delay (500ms, 1000ms, 2000ms).
 */

import { CRAWLER_CONFIG } from "./config";

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  maxRetries: number = CRAWLER_CONFIG.MAX_RETRIES,
  baseBackoffMs: number = CRAWLER_CONFIG.BASE_BACKOFF_MS
): Promise<{ response: Response; attempts: number }> {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const response = await fetch(url, init);
      if (response.ok || response.status === 404 || response.status === 403) {
        return { response, attempts: attempt };
      }
      // Retry on 5xx server errors
      if (response.status >= 500 && attempt < maxRetries) {
        const delay = baseBackoffMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return { response, attempts: attempt };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const delay = baseBackoffMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error(`Fetch failed for ${url} after ${maxRetries} attempts`);
}
