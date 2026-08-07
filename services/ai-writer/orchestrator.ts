/**
 * services/ai-writer/orchestrator.ts
 *
 * Universal AI Writer Engine Orchestrator (Phase 4B.5A).
 * Orchestrates Planner -> Outline Validation -> Section Generation -> Metadata ->
 * FAQ -> Schema -> Internal Links -> Product Placement -> Image Planner -> Quality Validator -> Save DB & Knowledge Engine.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { generateContentBrief } from "@/services/content-strategy/content-strategy-orchestrator";
import { aiWriterProviderRegistry } from "./provider-registry";
import { createWritingPlan } from "./planner";
import { validateWritingPlan } from "./outline-validator";
import { generateArticleSections } from "./section-generator";
import { generateArticleMetadata } from "./metadata-generator";
import { generateFinalFAQs } from "./faq-generator";
import { generateArticleSchema } from "./schema-generator";
import { injectInternalLinks } from "./internal-link-injector";
import { formatProductPlacementCTA } from "./product-placement";
import { planArticleImages } from "./image-planner";
import { validateArticleQuality } from "./quality-validator";
import { saveArticleDraftToKnowledge } from "./writer-knowledge";
import type { ArticleDraft, AIWriterResult } from "./types";

export async function generateArticleDraft(
  rawKeyword: string,
  country: string = "IN",
  providerId: string = "heuristic-fallback",
  modelName: string = "default",
  forceRefresh: boolean = false
): Promise<AIWriterResult> {
  const { supabase } = await getServerContext();
  const normalized = rawKeyword.toLowerCase().trim();
  const targetCountry = country.toUpperCase();

  // 1. CACHE LOOKUP (Latest Draft Version)
  if (!forceRefresh && supabase && typeof supabase.from === "function") {
    const { data: cached } = await supabase
      .from("article_drafts")
      .select("*")
      .eq("normalized_keyword", normalized)
      .eq("country", targetCountry)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      const [
        { data: sections },
        { data: meta },
        { data: images },
        { data: links },
        { data: report },
      ] = await Promise.all([
        supabase.from("article_sections").select("*").eq("draft_id", cached.id).order("position", { ascending: true }),
        supabase.from("article_metadata").select("*").eq("draft_id", cached.id).maybeSingle(),
        supabase.from("article_images").select("*").eq("draft_id", cached.id).order("position", { ascending: true }),
        supabase.from("article_internal_links").select("*").eq("draft_id", cached.id),
        supabase.from("article_validation_reports").select("*").eq("draft_id", cached.id).maybeSingle(),
      ]);

      console.log(`[AI WRITER CACHE HIT] Keyword: "${normalized}" (v${cached.version})`);

      const draftObj: ArticleDraft = {
        id: cached.id,
        keyword: cached.keyword,
        normalizedKeyword: cached.normalized_keyword,
        country: cached.country,
        provider: cached.provider,
        model: cached.model,
        version: cached.version,
        title: cached.title,
        metaTitle: cached.meta_title,
        metaDescription: cached.meta_description,
        slug: cached.slug,
        introduction: cached.introduction,
        summary: cached.summary || "",
        wordCount: cached.word_count,
        validationScore: cached.validation_score,
        sections: (sections || []).map((s: any) => ({ heading: s.heading, level: s.level, content: s.content, position: s.position })),
        faq: meta?.faq_json || [],
        schema: meta?.schema_json || [],
        cta: meta?.cta_json || { ctaType: "Soft CTA", heading: "", description: "", buttonText: "" },
        internalLinks: (links || []).map((l: any) => ({ anchorText: l.anchor_text, destinationUrl: l.destination_url, placementSection: l.placement_section })),
        imageSuggestions: (images || []).map((img: any) => ({ heading: img.heading, prompt: img.prompt, altText: img.alt_text, caption: img.caption, placement: img.placement, position: img.position })),
        altTexts: (images || []).map((img: any) => img.alt_text),
        references: meta?.references_json || [],
        knowledgeDocId: cached.knowledge_doc_id,
        createdAt: cached.created_at,
        updatedAt: cached.updated_at,
      };

      return {
        success: true,
        draft: draftObj,
        metadata: {
          title: cached.title,
          metaTitle: cached.meta_title,
          metaDescription: cached.meta_description,
          slug: cached.slug,
          ogTitle: meta?.og_title || cached.title,
          ogDescription: meta?.og_description || cached.meta_description,
          twitterDescription: meta?.twitter_description || cached.meta_description,
        },
        faq: meta?.faq_json || [],
        schema: meta?.schema_json || [],
        imagePlan: (images || []).map((img: any) => ({ heading: img.heading, prompt: img.prompt, altText: img.alt_text, caption: img.caption, placement: img.placement, position: img.position })),
        internalLinks: (links || []).map((l: any) => ({ anchorText: l.anchor_text, destinationUrl: l.destination_url, placementSection: l.placement_section })),
        validationReport: {
          validationScore: cached.validation_score,
          isValid: report?.is_valid ?? true,
          checksPassed: report?.checks_passed || [],
          errors: report?.errors || [],
          warnings: report?.warnings || [],
        },
        qualityScore: cached.validation_score,
        writingPlan: {
          keyword: cached.keyword,
          contentType: "Educational Blog",
          targetWordCount: cached.word_count,
          sectionOrder: (sections || []).map((s: any) => ({ heading: s.heading, level: s.level })),
          entityAllocation: {},
          keywordAllocation: {},
          internalLinkPlacements: (links || []).map((l: any) => ({ anchorText: l.anchor_text, destinationUrl: l.destination_url, placementSection: l.placement_section })),
          productPlacements: [],
        },
        knowledgeDocument: cached.knowledge_doc_id,
      };
    }
  }

  console.log(`[AI WRITER FRESH RUN] Generating Article Draft for "${normalized}" (${targetCountry}) via ${providerId}...`);

  // 2. READ / RUN CONTENT BRIEF (4B.4)
  const brief = await generateContentBrief(rawKeyword, targetCountry, false);

  // 3. GET MODEL PROVIDER
  const provider = aiWriterProviderRegistry.getProvider(providerId);

  // 4. STEP 1: PLANNER
  const writingPlan = createWritingPlan(brief);

  // 5. STEP 2: OUTLINE VALIDATOR
  const outlineValidation = validateWritingPlan(writingPlan, brief);
  if (!outlineValidation.isValid) {
    console.warn("[AI WRITER OUTLINE VALIDATION ERRORS]:", outlineValidation.errors);
  }

  // 6. STEP 3: SECTION GENERATOR
  const { introduction, sections } = await generateArticleSections(writingPlan, brief, provider);

  // 7. STEP 4: METADATA GENERATOR
  const metadata = generateArticleMetadata(brief);

  // 8. STEP 5: FAQ GENERATOR
  const faqs = generateFinalFAQs(brief);

  // 9. STEP 6: SCHEMA GENERATOR
  const schemas = generateArticleSchema(brief, metadata.metaTitle, metadata.slug, faqs);

  // 10. STEP 7: INTERNAL LINK INJECTOR
  const internalLinks = injectInternalLinks(writingPlan);

  // 11. STEP 8: PRODUCT PLACEMENT & CTA
  const cta = formatProductPlacementCTA(brief);

  // 12. STEP 9: IMAGE PLANNER
  const imageSuggestions = planArticleImages(brief);
  const altTexts = imageSuggestions.map((img) => img.altText);

  // 13. CALCULATE WORD COUNT
  const totalWords = introduction.split(" ").length + sections.reduce((sum, s) => sum + s.content.split(" ").length, 0);

  // 14. STEP 10: DRAFT VERSION DETERMINATION
  let nextVersion = 1;
  if (supabase && typeof supabase.from === "function") {
    const { data: maxVerRow } = await supabase
      .from("article_drafts")
      .select("version")
      .eq("normalized_keyword", normalized)
      .eq("country", targetCountry)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxVerRow?.version) {
      nextVersion = maxVerRow.version + 1;
    }
  }

  const draft: ArticleDraft = {
    keyword: rawKeyword.trim(),
    normalizedKeyword: normalized,
    country: targetCountry,
    provider: provider.name,
    model: modelName,
    version: nextVersion,
    title: metadata.title,
    metaTitle: metadata.metaTitle,
    metaDescription: metadata.metaDescription,
    slug: metadata.slug,
    introduction,
    summary: `Comprehensive ${writingPlan.contentType} draft for ${brief.keyword} (${totalWords} words).`,
    wordCount: totalWords,
    validationScore: 0,
    sections,
    faq: faqs,
    schema: schemas,
    cta,
    internalLinks,
    imageSuggestions,
    altTexts,
    references: [`Universal Knowledge Engine: ${brief.knowledgeDocId || "SEO Intelligence"}`],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 15. STEP 11: QUALITY VALIDATOR
  const qualityReport = validateArticleQuality(draft, brief);
  draft.validationScore = qualityReport.validationScore;

  // 16. SAVE TO KNOWLEDGE ENGINE
  const knowledgeDocId = await saveArticleDraftToKnowledge(draft, qualityReport);
  draft.knowledgeDocId = knowledgeDocId;

  // 17. DATABASE PERSISTENCE (VERSIONED DRAFT)
  if (supabase && typeof supabase.from === "function") {
    try {
      const { data: insertedDraft } = await supabase
        .from("article_drafts")
        .insert({
          keyword: draft.keyword,
          normalized_keyword: draft.normalizedKeyword,
          country: draft.country,
          provider: draft.provider,
          model: draft.model,
          version: draft.version,
          title: draft.title,
          meta_title: draft.metaTitle,
          meta_description: draft.metaDescription,
          slug: draft.slug,
          introduction: draft.introduction,
          summary: draft.summary,
          word_count: draft.wordCount,
          validation_score: draft.validationScore,
          knowledge_doc_id: draft.knowledgeDocId || null,
        })
        .select("id")
        .single();

      if (insertedDraft?.id) {
        draft.id = insertedDraft.id;

        // Sections Insert
        const secRows = sections.map((s) => ({
          draft_id: insertedDraft.id,
          heading: s.heading,
          level: s.level,
          content: s.content,
          position: s.position,
        }));
        if (secRows.length > 0) {
          await supabase.from("article_sections").insert(secRows);
        }

        // Metadata Insert
        await supabase.from("article_metadata").insert({
          draft_id: insertedDraft.id,
          og_title: metadata.ogTitle,
          og_description: metadata.ogDescription,
          twitter_description: metadata.twitterDescription,
          schema_json: schemas,
          cta_json: cta,
          faq_json: faqs,
          references_json: draft.references,
        });

        // Images Insert
        const imgRows = imageSuggestions.map((img) => ({
          draft_id: insertedDraft.id,
          heading: img.heading,
          prompt: img.prompt,
          alt_text: img.altText,
          caption: img.caption,
          placement: img.placement,
          position: img.position,
        }));
        if (imgRows.length > 0) {
          await supabase.from("article_images").insert(imgRows);
        }

        // Internal Links Insert
        const linkRows = internalLinks.map((l) => ({
          draft_id: insertedDraft.id,
          anchor_text: l.anchorText,
          destination_url: l.destinationUrl,
          placement_section: l.placementSection,
        }));
        if (linkRows.length > 0) {
          await supabase.from("article_internal_links").insert(linkRows);
        }

        // Quality Report Insert
        await supabase.from("article_validation_reports").insert({
          draft_id: insertedDraft.id,
          validation_score: qualityReport.validationScore,
          is_valid: qualityReport.isValid,
          checks_passed: qualityReport.checksPassed,
          errors: qualityReport.errors,
          warnings: qualityReport.warnings,
        });
      }
    } catch (dbErr) {
      console.error("[AI WRITER DB INSERT ERROR]:", dbErr);
    }
  }

  return {
    success: true,
    draft,
    metadata,
    faq: faqs,
    schema: schemas,
    imagePlan: imageSuggestions,
    internalLinks,
    validationReport: qualityReport,
    qualityScore: qualityReport.validationScore,
    writingPlan,
    knowledgeDocument: knowledgeDocId,
  };
}
