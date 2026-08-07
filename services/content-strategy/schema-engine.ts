/**
 * services/content-strategy/schema-engine.ts
 *
 * Deterministic Schema Recommendation Engine (Phase 4B.4).
 * Recommends JSON-LD structured data schemas according to Intent and Content Type.
 * Options: Article, FAQPage, HowTo, Product, BreadcrumbList, Review, CollectionPage.
 * NO LLM, 100% rule-based recommendation.
 */

import type { ContentType } from "./types";

export function recommendSchemas(intent: string, contentType: ContentType): string[] {
  const schemas: Set<string> = new Set(["BreadcrumbList", "Article"]);

  const lowerIntent = intent.toLowerCase();

  if (contentType === "FAQ Article" || lowerIntent === "informational") {
    schemas.add("FAQPage");
  }

  if (contentType === "Buying Guide" || contentType === "Comparison Article") {
    schemas.add("HowTo");
    schemas.add("Review");
  }

  if (contentType === "Category Page" || lowerIntent === "transactional") {
    schemas.add("CollectionPage");
    schemas.add("Product");
  }

  return Array.from(schemas);
}
