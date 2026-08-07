/**
 * services/ai-writer/internal-link-injector.ts
 *
 * Internal Link Injector for Phase 4B.5A AI Writer Engine.
 * Converts Topic Graph link recommendations into concrete InternalLinkPlacement items.
 * NO HALLUCINATED LINKS.
 */

import type { WritingPlan, InternalLinkPlacement } from "./types";

export function injectInternalLinks(plan: WritingPlan): InternalLinkPlacement[] {
  return plan.internalLinkPlacements.map((l) => ({
    anchorText: l.anchorText,
    destinationUrl: l.destinationUrl,
    placementSection: l.placementSection,
  }));
}
