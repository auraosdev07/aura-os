/**
 * services/ai-writer/metadata-generator.ts
 *
 * Metadata Generator for Phase 4B.5A AI Writer Engine.
 * Produces Meta Title, Meta Description, URL Slug, OG Title, OG Description, Twitter Description.
 * NO LLM, 100% deterministic rules.
 */

import type { SEOContentBrief } from "@/services/content-strategy/types";

export interface ArticleMetadataResult {
  title: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  ogTitle: string;
  ogDescription: string;
  twitterDescription: string;
}

export function generateArticleMetadata(brief: SEOContentBrief): ArticleMetadataResult {
  const kwCap = brief.keyword.replace(/\b\w/g, (c) => c.toUpperCase());
  const year = new Date().getFullYear();

  const title = brief.titleIdeas[0]?.title || `The Complete ${kwCap} Guide (${year})`;

  // Meta Title (Max 60 chars)
  let metaTitle = `${kwCap}: Meaning, Benefits & Buying Guide (${year})`;
  if (metaTitle.length > 60) {
    metaTitle = `${kwCap} Guide: Meaning & Benefits (${year})`;
  }

  // Meta Description (Max 155 chars)
  const metaDescription = `Discover the healing benefits, spiritual meaning, and authenticity test for ${kwCap}. Learn how to choose genuine certified gemstones in ${year}.`;

  // URL Slug
  const slug = brief.normalizedKeyword.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return {
    title,
    metaTitle,
    metaDescription: metaDescription.slice(0, 155),
    slug,
    ogTitle: title,
    ogDescription: metaDescription.slice(0, 155),
    twitterDescription: metaDescription.slice(0, 155),
  };
}
