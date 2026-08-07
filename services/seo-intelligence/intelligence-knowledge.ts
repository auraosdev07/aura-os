/**
 * services/seo-intelligence/intelligence-knowledge.ts
 *
 * SEO Intelligence Knowledge Engine Integration (Phase 4B.2).
 * Auto-saves SEO Intelligence reports into the Universal Knowledge Engine under "SEO Intelligence" collection.
 */

import { getCollections, createCollection, createDocument } from "@/services/knowledge-engine";
import type { SEOIntelligenceReport } from "./types";

export async function saveSEOIntelligenceToKnowledge(report: SEOIntelligenceReport): Promise<string | undefined> {
  try {
    const collections = await getCollections();
    let intelColl = collections.find((c) => c.name === "SEO Intelligence");

    if (!intelColl) {
      intelColl = await createCollection({
        name: "SEO Intelligence",
        description: "Normalized search intelligence reports, provider telemetry, mined entities, and intent insights.",
        type: "DOCUMENTATION",
        tags: ["seo", "intelligence", "keyword_research", "signals"],
      });
    }

    const entitiesText = report.extractedEntities.length > 0
      ? "\n\nExtracted Entities:\n" + report.extractedEntities.map((e) => `- [${e.type.toUpperCase()}] ${e.text} (Confidence: ${e.confidence})`).join("\n")
      : "";

    const questionsText = report.questions.length > 0
      ? "\n\nTop Questions:\n" + report.questions.slice(0, 10).map((q) => `- ${q.text} (Source: ${q.sourceName})`).join("\n")
      : "";

    const fullContent = `SEO Intelligence Report for "${report.keyword}" (${report.country})
Normalized Keyword: ${report.normalizedKeyword}
Intent: ${report.intent} (Confidence: ${report.intentConfidence})
Total Provider Signals Collected: ${report.totalSignalsCollected}
Active Providers: ${report.activeProviders.join(", ")}

Suggestions: ${report.suggestions.length}
Questions: ${report.questions.length}
Related Searches: ${report.relatedSearches.length}
Community Discussions: ${report.communityDiscussions.length}
SERP Items: ${report.serpSnapshot.length}${entitiesText}${questionsText}`;

    const doc = await createDocument({
      collectionId: intelColl.id,
      title: `SEO Intelligence: ${report.keyword} [${report.country}] (${report.intent})`,
      source: `keyword://${report.normalizedKeyword}/${report.country}`,
      rawContent: fullContent,
      summary: `SEO Intelligence for "${report.keyword}" classified intent as ${report.intent} (${report.intentConfidence} confidence) with ${report.totalSignalsCollected} collected provider signals.`,
      tags: ["seo_intelligence", `kw_${report.normalizedKeyword.replace(/\s+/g, "_")}`, `country_${report.country}`, `intent_${report.intent}`],
      language: "en",
    });

    return doc?.id as string | undefined;
  } catch (err) {
    console.error("[SAVE SEO INTELLIGENCE KNOWLEDGE ERROR]:", err);
    return undefined;
  }
}
