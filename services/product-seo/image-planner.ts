/**
 * services/product-seo/image-planner.ts
 *
 * Image Planner Engine for Product SEO.
 * Reuses Image Planning conventions.
 */

import type { SEOContentBrief } from "@/services/content-strategy/types";
import type { ProductImagePlanItem } from "./types";

export function generateProductImagePlan(brief: SEOContentBrief): ProductImagePlanItem[] {
  const kwCap = brief.keyword.replace(/\b\w/g, (c) => c.toUpperCase());

  return [
    {
      heading: `Main Product Showcase: ${kwCap}`,
      prompt: `Studio product photography of an authentic 8mm ${kwCap} bracelet displayed on white marble with soft natural shadows.`,
      altText: `Original ${kwCap} natural gemstone bracelet on marble background`,
      caption: `100% genuine ${kwCap} handcrafted with 8mm natural beads.`,
      placement: "Main Product Gallery Image 1",
      position: 1,
    },
    {
      heading: `Bead Macro & Texture Close-up`,
      prompt: `Extreme macro photography of ${kwCap} beads revealing genuine natural mineral inclusions and translucency.`,
      altText: `Close-up macro view showing genuine natural texture of ${kwCap} beads`,
      caption: `Natural color variations and stone inclusions confirm authentic mineral purity.`,
      placement: "Gallery Image 2 & Benefit Section",
      position: 2,
    },
    {
      heading: `Gemological Lab Certificate`,
      prompt: `Flat lay photography of ${kwCap} alongside an official gemological test report and authenticity seal.`,
      altText: `Lab test certificate confirming authenticity of ${kwCap}`,
      caption: `Every bracelet comes with an official ISO-certified gemological report.`,
      placement: "Authenticity & Care Section",
      position: 3,
    },
  ];
}
