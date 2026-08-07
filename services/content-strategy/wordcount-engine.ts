/**
 * services/content-strategy/wordcount-engine.ts
 *
 * Deterministic Word Count Engine (Phase 4B.4).
 * Word count target recommendations:
 *   FAQ Article        -> 1,200 words
 *   Category Page      -> 1,800 words
 *   Educational Blog   -> 2,200 words
 *   Comparison Article -> 2,500 words
 *   Buying Guide       -> 3,000 words
 * NO LLM, 100% deterministic targets.
 */

import type { ContentType } from "./types";

export function calculateWordCountTarget(contentType: ContentType): number {
  switch (contentType) {
    case "FAQ Article":
      return 1200;
    case "Category Page":
      return 1800;
    case "Educational Blog":
      return 2200;
    case "Comparison Article":
      return 2500;
    case "Buying Guide":
      return 3000;
    default:
      return 1500;
  }
}
