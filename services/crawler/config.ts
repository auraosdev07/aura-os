/**
 * services/crawler/config.ts
 *
 * Centralized Crawler Configuration Module (Phase 4A.5).
 * Houses all timeouts, delays, concurrency limits, SPA content length thresholds,
 * retry counts, and rate-limiting defaults. No hardcoded constants in service code.
 */

export const CRAWLER_CONFIG = {
  /** Default User Agent */
  USER_AGENT: "AuraOSBot/1.0 (+https://auraos.dev/bot)",

  /** Crawl Depth & Page Limits */
  DEFAULT_MAX_DEPTH: 2,
  DEFAULT_MAX_PAGES: 20,

  /** Network & Fetching */
  DEFAULT_TIMEOUT_MS: 10000,
  DEFAULT_RATE_LIMIT_MS: 300,

  /** Retry Policy */
  MAX_RETRIES: 3,
  BASE_BACKOFF_MS: 500,

  /** Playwright Rendering Fallback Thresholds */
  MIN_BODY_TEXT_LENGTH: 150,
  MIN_HTML_LENGTH: 250,

  /** Concurrency */
  MAX_CONCURRENT_PAGES: 3,
} as const;
