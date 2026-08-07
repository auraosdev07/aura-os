/**
 * services/seo-intelligence/config.ts
 *
 * Configuration parameters for SEO Intelligence Layer.
 * All timeouts, endpoints, thresholds, and limits are stored here.
 */

export const SEO_INTEL_CONFIG = {
  /** Global Cache Policy */
  CACHE_TTL_DAYS: 7,

  /** Network and Request Settings */
  DEFAULT_TIMEOUT_MS: 8000,
  DEFAULT_RATE_LIMIT_MS: 400,
  USER_AGENT: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

  /** Provider Endpoints */
  GOOGLE_SUGGEST_URL: "https://suggestqueries.google.com/complete/search?client=firefox&q=",
  GOOGLE_SERP_URL: "https://www.google.com/search?q=",
  REDDIT_SEARCH_URL: "https://www.reddit.com/search.json?q=",
  DUCKDUCKGO_HTML_URL: "https://html.duckduckgo.com/html/?q=",

  /** Limits per collector */
  MAX_SUGGESTIONS: 15,
  MAX_PAA_QUESTIONS: 15,
  MAX_COMMUNITY_POSTS: 15,
  MAX_SERP_ITEMS: 10,
  MAX_RELATED_SEARCHES: 10,

  /** Provider Cooldown for blocked states (ms) */
  BLOCK_COOLDOWN_MS: 15 * 60 * 1000, // 15 minutes
} as const;
