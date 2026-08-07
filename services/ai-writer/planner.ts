/**
 * services/ai-writer/planner.ts
 *
 * Deterministic Article Planner Engine (Phase 4B.5A).
 * Consumes Content Brief, Topic Graph, and SEO Intelligence to produce a WritingPlan.
 * Allocates entities, keywords, internal link placements, and product placements section by section.
 * NO ARTICLE GENERATION HERE — Pure deterministic planning.
 */

import type { SEOContentBrief } from "@/services/content-strategy/types";
import type { WritingPlan, InternalLinkPlacement } from "./types";

export function createWritingPlan(brief: SEOContentBrief): WritingPlan {
  const sectionOrder: Array<{ heading: string; level: "H1" | "H2" | "H3" | "H4" }> = [];

  // Extract headings from brief heading tree
  if (brief.headingTree && brief.headingTree.length > 0) {
    const root = brief.headingTree[0];
    sectionOrder.push({ heading: root.text, level: root.level });

    if (root.subheadings) {
      for (const sub of root.subheadings) {
        sectionOrder.push({ heading: sub.text, level: sub.level });
        if (sub.subheadings) {
          for (const sub2 of sub.subheadings) {
            sectionOrder.push({ heading: sub2.text, level: sub2.level });
          }
        }
      }
    }
  } else {
    sectionOrder.push(
      { heading: `The Complete Guide to ${brief.keyword}`, level: "H1" },
      { heading: `What is a ${brief.keyword}?`, level: "H2" },
      { heading: `Key Benefits & Healing Properties`, level: "H2" },
      { heading: `How to Choose an Original vs Fake`, level: "H2" },
      { heading: `Conclusion & Where to Buy`, level: "H2" }
    );
  }

  // Allocate entities & keywords per section
  const entityAllocation: Record<string, string[]> = {};
  const keywordAllocation: Record<string, string[]> = {};

  sectionOrder.forEach((sec, idx) => {
    entityAllocation[sec.heading] = brief.entityCoverage?.primaryEntities || [];
    keywordAllocation[sec.heading] = idx % 2 === 0
      ? brief.semanticKeywords?.secondary || []
      : brief.semanticKeywords?.supporting || [];
  });

  // Map internal links to sections
  const internalLinkPlacements: InternalLinkPlacement[] = brief.internalLinks.map((l, i) => ({
    anchorText: l.anchorText,
    destinationUrl: `https://auraos.dev/topics/${l.targetKeyword.toLowerCase().replace(/\s+/g, "-")}`,
    placementSection: sectionOrder[Math.min(i + 1, sectionOrder.length - 1)]?.heading || sectionOrder[0].heading,
  }));

  // Map product placements
  const productPlacements = brief.productPlacements.map((p) => ({
    location: p.placementLocation,
    productType: p.suggestedProductTypes[0] || brief.keyword,
  }));

  return {
    keyword: brief.keyword,
    contentType: brief.recommendedContentType,
    targetWordCount: brief.recommendedWordCount,
    sectionOrder,
    entityAllocation,
    keywordAllocation,
    internalLinkPlacements,
    productPlacements,
  };
}
