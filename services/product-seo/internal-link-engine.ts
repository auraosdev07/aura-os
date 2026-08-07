/**
 * services/product-seo/internal-link-engine.ts
 *
 * Internal Link Engine for Product SEO.
 */

import type { SEOContentBrief } from "@/services/content-strategy/types";
import type { ProductInternalLinkItem } from "./types";

export function generateProductInternalLinks(brief: SEOContentBrief): ProductInternalLinkItem[] {
  return brief.internalLinks.map((l) => ({
    anchorText: l.anchorText,
    destinationUrl: `https://auraos.dev/topics/${l.targetKeyword.toLowerCase().replace(/\s+/g, "-")}`,
    placementContext: "Product Healing Benefits & Uses Section",
  }));
}
