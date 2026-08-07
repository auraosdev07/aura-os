/**
 * services/product-seo/metadata-engine.ts
 *
 * Product SEO Metadata & Description Engine.
 * Generates SEO Title, Meta Title, Meta Description, URL Slug, Short Description, Long Description.
 */

import type { SEOContentBrief } from "@/services/content-strategy/types";

export interface ProductMetadataResult {
  seoTitle: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
}

export function generateProductMetadata(productId: string, brief: SEOContentBrief): ProductMetadataResult {
  const kwCap = brief.keyword.replace(/\b\w/g, (c) => c.toUpperCase());
  const year = new Date().getFullYear();

  const seoTitle = `Original ${kwCap} — Certified Natural Gemstone Bracelet`;
  const metaTitle = `Buy Original ${kwCap} Online (${year}) — Lab Certified`;
  const metaDescription = `Shop authentic 100% natural ${kwCap} with gemological certificate. Experience genuine healing properties, aura protection, and chakra alignment.`;
  const slug = `product-${productId.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${brief.normalizedKeyword.replace(/\s+/g, "-")}`;

  const shortDescription = `Handcrafted natural ${kwCap} strung with premium 8mm gemstone beads. Lab-certified for mineral purity, promoting emotional wellness, peace, and positive vibrational resonance.`;

  const longDescription = `Experience the profound energetic resonance of our authentic ${kwCap}. Meticulously selected by expert gemologists, each bead showcases natural mineral variations, brilliant translucency, and authentic weight. Whether worn for daily mindfulness, chakra balancing, or aesthetic elegance, this lab-certified bracelet serves as a potent spiritual talisman. Each order includes a gemological test report, luxury velvet pouch, and comprehensive crystal care guide.`;

  return {
    seoTitle,
    metaTitle: metaTitle.slice(0, 60),
    metaDescription: metaDescription.slice(0, 155),
    slug,
    shortDescription,
    longDescription,
  };
}
