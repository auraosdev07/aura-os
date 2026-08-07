/**
 * services/ai-writer/image-planner.ts
 *
 * Image Planner Engine for Phase 4B.5A AI Writer Engine.
 * Generates image prompt, alt text, caption, and placement plan.
 * NO IMAGE GENERATION — Planning only.
 */

import type { SEOContentBrief } from "@/services/content-strategy/types";
import type { ImagePlanItem } from "./types";

export function planArticleImages(brief: SEOContentBrief): ImagePlanItem[] {
  const kwCap = brief.keyword.replace(/\b\w/g, (c) => c.toUpperCase());

  return [
    {
      heading: `Hero Banner: ${kwCap}`,
      prompt: `High-resolution studio photography of an authentic ${kwCap} placed on a natural quartz cluster with soft warm lighting.`,
      altText: `Authentic ${kwCap} gemstone beads on crystal cluster`,
      caption: `Genuine ${kwCap} handcrafted with 8mm natural gemstones.`,
      placement: "Below H1 Title",
      position: 1,
    },
    {
      heading: `Benefits Showcase: ${kwCap}`,
      prompt: `Close-up macro shot of ${kwCap} beads showing genuine mineral texture and color variations under natural sunlight.`,
      altText: `Close-up view of genuine ${kwCap} beads`,
      caption: `Natural color variations and inclusions verify authentic stone quality.`,
      placement: "Below Benefits H2 Section",
      position: 2,
    },
    {
      heading: `Authenticity Verification: ${kwCap}`,
      prompt: `Flat lay photography of ${kwCap} alongside a gemological lab test certificate and magnifying glass.`,
      altText: `Lab-certified ${kwCap} with gemological test report`,
      caption: `Each bracelet undergoes rigorous lab verification for mineral purity.`,
      placement: "Below Authenticity Inspection H2 Section",
      position: 3,
    },
  ];
}
