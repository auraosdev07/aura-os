/**
 * services/content-strategy/content-type-engine.ts
 *
 * Deterministic Content Type Selection Engine (Phase 4B.4).
 * Rules:
 *   commercial    -> Buying Guide
 *   transactional -> Category Page
 *   informational -> Educational Blog
 *   comparison    -> Comparison Article
 *   question      -> FAQ Article
 * NO LLM, 100% deterministic intent-to-type mapping.
 */

import type { ContentType } from "./types";

export function determineContentType(intent: string, keyword: string): ContentType {
  const lowerKw = keyword.toLowerCase();
  const lowerIntent = intent.toLowerCase();

  if (lowerKw.includes("vs") || lowerKw.includes("or") || lowerKw.includes("compare") || lowerKw.includes("difference")) {
    return "Comparison Article";
  }

  if (lowerKw.startsWith("how") || lowerKw.startsWith("what") || lowerKw.startsWith("why") || lowerKw.startsWith("can i") || lowerKw.endsWith("?")) {
    return "FAQ Article";
  }

  if (lowerIntent === "commercial" || lowerKw.includes("best") || lowerKw.includes("top") || lowerKw.includes("review")) {
    return "Buying Guide";
  }

  if (lowerIntent === "transactional" || lowerKw.includes("buy") || lowerKw.includes("price") || lowerKw.includes("shop") || lowerKw.includes("store")) {
    return "Category Page";
  }

  return "Educational Blog";
}
