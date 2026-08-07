/**
 * services/content-strategy/content-brief-knowledge.ts
 *
 * Universal Knowledge Engine Integration for Phase 4B.4.
 * Auto-saves SEO Content Briefs into "SEO Content Briefs" collection.
 */

import { getCollections, createCollection, createDocument } from "@/services/knowledge-engine";
import type { SEOContentBrief } from "./types";

export async function saveContentBriefToKnowledge(brief: SEOContentBrief): Promise<string | undefined> {
  try {
    const collections = await getCollections();
    let briefColl = collections.find((c) => c.name === "SEO Content Briefs");

    if (!briefColl) {
      briefColl = await createCollection({
        name: "SEO Content Briefs",
        description: "Universal SEO Content Briefs detailing content types, title recommendations, heading trees, FAQs, entity coverage, semantic keywords, internal link anchors, CTAs, product placements, and schemas.",
        type: "DOCUMENTATION",
        tags: ["seo", "content_brief", "strategy", "headings", "faqs"],
      });
    }

    const titlesText = brief.titleIdeas.slice(0, 4).map((t) => `- [${t.type}] ${t.title}`).join("\n");
    const faqsText = brief.faqList.slice(0, 4).map((f) => `- [${f.priority}] ${f.question}`).join("\n");
    const linksText = brief.internalLinks.slice(0, 4).map((l) => `- ${l.sourceKeyword} -> ${l.targetKeyword} (Anchor: "${l.anchorText}")`).join("\n");

    const fullContent = `SEO Content Brief for "${brief.keyword}" [${brief.country}]
Intent: ${brief.intent}
Recommended Content Type: ${brief.recommendedContentType}
Target Word Count: ${brief.recommendedWordCount} words
Brief Quality Score: ${brief.briefScore}/100
Recommended JSON-LD Schemas: ${brief.recommendedSchema.join(", ")}

Title Ideas:
${titlesText}

FAQ Structure:
${faqsText}

Primary Entities: ${brief.entityCoverage.primaryEntities.join(", ")}
Secondary Entities: ${brief.entityCoverage.secondaryEntities.join(", ")}

CTA Recommendation: ${brief.ctaRecommendation.ctaType} ("${brief.ctaRecommendation.heading}")
Product Placements: ${brief.productPlacements.map((p) => p.placementLocation).join(", ")}

Internal Link Strategy:
${linksText}`;

    const doc = await createDocument({
      collectionId: briefColl.id,
      title: `SEO Content Brief: ${brief.keyword} [${brief.recommendedContentType}] (Score: ${brief.briefScore}/100)`,
      source: `content-brief://${brief.normalizedKeyword}/${brief.country}`,
      rawContent: fullContent,
      summary: `SEO Content Brief for "${brief.keyword}" recommends '${brief.recommendedContentType}' (${brief.recommendedWordCount} words) with a brief score of ${brief.briefScore}/100.`,
      tags: ["content_brief", `kw_${brief.normalizedKeyword.replace(/\s+/g, "_")}`, `type_${brief.recommendedContentType.replace(/\s+/g, "_")}`],
      language: "en",
    });

    return doc?.id as string | undefined;
  } catch (err) {
    console.error("[SAVE CONTENT BRIEF KNOWLEDGE ERROR]:", err);
    return undefined;
  }
}
