/**
 * services/ai-writer/writer-knowledge.ts
 *
 * Universal Knowledge Engine Integration for Phase 4B.5A AI Writer Engine.
 * Auto-saves AI Writer Drafts into "AI Writer Drafts" collection.
 */

import { getCollections, createCollection, createDocument } from "@/services/knowledge-engine";
import type { ArticleDraft, ValidationReport } from "./types";

export async function saveArticleDraftToKnowledge(
  draft: ArticleDraft,
  report: ValidationReport
): Promise<string | undefined> {
  try {
    const collections = await getCollections();
    let writerColl = collections.find((c) => c.name === "AI Writer Drafts");

    if (!writerColl) {
      writerColl = await createCollection({
        name: "AI Writer Drafts",
        description: "Production-grade AI Writer Article Drafts complete with validation scores, metadata, image plans, internal link placements, and JSON-LD schemas.",
        type: "DOCUMENTATION",
        tags: ["seo", "ai_writer", "drafts", "articles", "quality_report"],
      });
    }

    const sectionsOutline = draft.sections.map((s) => `- [${s.level}] ${s.heading}`).join("\n");
    const faqsSummary = draft.faq.slice(0, 3).map((f) => `- Q: ${f.question}`).join("\n");

    const fullContent = `AI Writer Article Draft: "${draft.title}"
Keyword: ${draft.keyword} [${draft.country}]
Provider: ${draft.provider} (Model: ${draft.model}, Version: ${draft.version})
Validation Score: ${draft.validationScore}/100 (Valid: ${report.isValid})
Word Count: ${draft.wordCount} words
Meta Title: ${draft.metaTitle}
Meta Description: ${draft.metaDescription}
URL Slug: /articles/${draft.slug}

Introduction:
${draft.introduction}

Section Outline:
${sectionsOutline}

FAQ Section:
${faqsSummary}

CTA Strategy: ${draft.cta.ctaType} ("${draft.cta.heading}")
Internal Links Injected: ${draft.internalLinks.length}
Images Planned: ${draft.imageSuggestions.length}`;

    const doc = await createDocument({
      collectionId: writerColl.id,
      title: `AI Draft: ${draft.title} (${draft.wordCount} words, Score: ${draft.validationScore}/100)`,
      source: `ai-writer://${draft.normalizedKeyword}/${draft.country}/v${draft.version}`,
      rawContent: fullContent,
      summary: `AI Draft generated for '${draft.keyword}' containing ${draft.sections.length} sections and ${draft.wordCount} words with quality validation score ${draft.validationScore}/100.`,
      tags: ["ai_writer_draft", `kw_${draft.normalizedKeyword.replace(/\s+/g, "_")}`, `v${draft.version}`],
      language: "en",
    });

    return doc?.id as string | undefined;
  } catch (err) {
    console.error("[SAVE AI WRITER DRAFT KNOWLEDGE ERROR]:", err);
    return undefined;
  }
}
