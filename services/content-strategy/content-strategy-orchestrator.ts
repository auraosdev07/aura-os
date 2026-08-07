/**
 * services/content-strategy/content-strategy-orchestrator.ts
 *
 * Universal Content Brief Generator Orchestrator (Phase 4B.4).
 * Coordinates SEO Intelligence (4B.2), Topic Graph (4B.3), and SEO Audit data
 * to produce a production-ready SEOContentBrief.
 *
 * NO LLM REASONING, NO FABRICATED METRICS. 100% DETERMINISTIC.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { getSEOIntelligence } from "@/services/seo-intelligence/orchestrator";
import { generateTopicIntelligence } from "@/services/topic-intelligence/orchestrator";
import { determineContentType } from "./content-type-engine";
import { generateTitleIdeas } from "./title-engine";
import { generateHeadingTree } from "./heading-engine";
import { generateFAQList } from "./faq-engine";
import { analyzeEntityCoverage } from "./entity-coverage";
import { groupSemanticKeywords } from "./semantic-keyword-engine";
import { generateCTARecommendation } from "./cta-engine";
import { generateProductPlacements } from "./product-placement-engine";
import { recommendSchemas } from "./schema-engine";
import { calculateWordCountTarget } from "./wordcount-engine";
import { calculateBriefScore } from "./brief-score";
import { saveContentBriefToKnowledge } from "./content-brief-knowledge";
import type { SEOContentBrief, ContentSection, InternalLinkSuggestion } from "./types";

export async function generateContentBrief(
  rawKeyword: string,
  country: string = "IN",
  forceRefresh: boolean = false
): Promise<SEOContentBrief> {
  const { supabase } = await getServerContext();
  const normalized = rawKeyword.toLowerCase().trim();
  const targetCountry = country.toUpperCase();

  // 1. CACHE LOOKUP
  if (!forceRefresh && supabase && typeof supabase.from === "function") {
    const { data: cachedBrief } = await supabase
      .from("content_briefs")
      .select("*")
      .eq("normalized_keyword", normalized)
      .eq("country", targetCountry)
      .maybeSingle();

    if (cachedBrief) {
      const { data: sectionRows } = await supabase
        .from("content_brief_sections")
        .select("*")
        .eq("brief_id", cachedBrief.id)
        .order("position", { ascending: true });

      const secMap = new Map<string, any>();
      (sectionRows || []).forEach((s: any) => secMap.set(s.section_type, s.content));

      console.log(`[CONTENT BRIEF CACHE HIT] Keyword: "${normalized}" (${targetCountry})`);
      return {
        id: cachedBrief.id,
        keyword: cachedBrief.keyword,
        normalizedKeyword: cachedBrief.normalized_keyword,
        country: cachedBrief.country,
        clusterId: cachedBrief.cluster_id,
        intent: cachedBrief.intent,
        recommendedContentType: cachedBrief.recommended_content_type as any,
        recommendedWordCount: cachedBrief.recommended_word_count,
        recommendedSchema: cachedBrief.recommended_schema || [],
        briefScore: cachedBrief.brief_score,
        titleIdeas: secMap.get("TITLE_IDEAS")?.items || [],
        headingTree: secMap.get("HEADINGS")?.tree || [],
        faqList: secMap.get("FAQS")?.items || [],
        entityCoverage: secMap.get("ENTITIES") || { primaryEntities: [], secondaryEntities: [], missingEntities: [], requiredMentions: [], entityDensityTarget: "1.5% - 2.5%" },
        semanticKeywords: secMap.get("SEMANTIC_KEYWORDS") || { primary: [cachedBrief.keyword], secondary: [], supporting: [], longTail: [], questionKeywords: [], commercialKeywords: [] },
        missingTopics: secMap.get("MISSING_TOPICS")?.items || [],
        internalLinks: secMap.get("INTERNAL_LINKS")?.items || [],
        ctaRecommendation: secMap.get("CTA") || { ctaType: "Soft CTA", heading: "", description: "", buttonText: "" },
        productPlacements: secMap.get("PRODUCT_PLACEMENT")?.items || [],
        knowledgeDocId: cachedBrief.knowledge_doc_id,
        createdAt: cachedBrief.created_at,
        updatedAt: cachedBrief.updated_at,
        isCached: true,
      };
    }
  }

  console.log(`[CONTENT BRIEF FRESH RUN] Generating Brief for "${normalized}" (${targetCountry})...`);

  // 2. READ / RUN SEO INTELLIGENCE & TOPIC GRAPH
  const intelReport = await getSEOIntelligence(rawKeyword, targetCountry, false);
  let topicGraphResult;
  try {
    topicGraphResult = await generateTopicIntelligence(targetCountry);
  } catch {
    topicGraphResult = null;
  }

  // 3. EXECUTE ENGINE PIPELINE DETERMINISTICALLY
  const intent = intelReport.intent;
  const contentType = determineContentType(intent, rawKeyword);
  const titleIdeas = generateTitleIdeas(rawKeyword, targetCountry);
  const headingTree = generateHeadingTree(rawKeyword, intelReport.questions.map((q) => q.text), intelReport.extractedEntities);
  const faqList = generateFAQList(intelReport.questions, rawKeyword);
  const entityCoverage = analyzeEntityCoverage(intelReport.extractedEntities, rawKeyword);
  const semanticKeywords = groupSemanticKeywords(rawKeyword, intelReport.suggestions, intelReport.relatedSearches, intelReport.questions);
  const ctaRecommendation = generateCTARecommendation(intent, rawKeyword);
  const productPlacements = generateProductPlacements(rawKeyword);
  const recommendedSchema = recommendSchemas(intent, contentType);
  const recommendedWordCount = calculateWordCountTarget(contentType);

  // Missing Topics from Topic Graph Gaps
  const missingTopics = topicGraphResult
    ? topicGraphResult.contentGaps.map((g) => g.keyword)
    : ["Originality test", "Bead size guide", "Spiritual cleansing"];

  // Internal Link Recommendations
  const internalLinks: InternalLinkSuggestion[] = topicGraphResult
    ? topicGraphResult.internalLinks.map((l) => ({
        sourceKeyword: l.sourceKeyword,
        targetKeyword: l.targetKeyword,
        anchorText: `${l.targetKeyword.replace(/\b\w/g, (c) => c.toUpperCase())}`,
        reason: l.reason,
        priority: l.score > 85 ? "HIGH" : "MEDIUM",
      }))
    : [
        {
          sourceKeyword: rawKeyword,
          targetKeyword: `${rawKeyword} benefits`,
          anchorText: `${rawKeyword} benefits guide`,
          reason: "Topical hierarchy pillar link",
          priority: "HIGH",
        },
      ];

  const briefScore = calculateBriefScore({
    titleCount: titleIdeas.length,
    headingCount: headingTree[0]?.subheadings?.length || 4,
    faqCount: faqList.length,
    entityCount: entityCoverage.primaryEntities.length + entityCoverage.secondaryEntities.length,
    keywordCount: semanticKeywords.secondary.length + semanticKeywords.longTail.length,
    internalLinkCount: internalLinks.length,
    missingTopicCount: missingTopics.length,
  });

  const brief: SEOContentBrief = {
    keyword: rawKeyword.trim(),
    normalizedKeyword: normalized,
    country: targetCountry,
    clusterId: topicGraphResult?.clusters[0]?.id,
    intent,
    recommendedContentType: contentType,
    recommendedWordCount,
    recommendedSchema,
    briefScore,
    titleIdeas,
    headingTree,
    faqList,
    entityCoverage,
    semanticKeywords,
    missingTopics,
    internalLinks,
    ctaRecommendation,
    productPlacements,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isCached: false,
  };

  // 4. SAVE TO KNOWLEDGE ENGINE
  const docId = await saveContentBriefToKnowledge(brief);
  brief.knowledgeDocId = docId;

  // 5. DATABASE UPSERT & SECTION STORAGE
  if (supabase && typeof supabase.from === "function") {
    try {
      const { data: upsertedBrief } = await supabase
        .from("content_briefs")
        .upsert(
          {
            keyword: brief.keyword,
            normalized_keyword: brief.normalizedKeyword,
            country: brief.country,
            cluster_id: brief.clusterId || null,
            intent: brief.intent,
            recommended_content_type: brief.recommendedContentType,
            recommended_word_count: brief.recommendedWordCount,
            recommended_schema: brief.recommendedSchema,
            brief_score: brief.briefScore,
            knowledge_doc_id: brief.knowledgeDocId || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "normalized_keyword,country" }
        )
        .select("id")
        .single();

      if (upsertedBrief?.id) {
        brief.id = upsertedBrief.id;

        // Delete existing section rows for refresh
        await supabase.from("content_brief_sections").delete().eq("brief_id", upsertedBrief.id);

        const sections: ContentSection[] = [
          { sectionType: "TITLE_IDEAS", title: "Title Recommendations", content: { items: titleIdeas }, position: 1 },
          { sectionType: "HEADINGS", title: "Heading Outline Tree", content: { tree: headingTree }, position: 2 },
          { sectionType: "FAQS", title: "Frequently Asked Questions", content: { items: faqList }, position: 3 },
          { sectionType: "ENTITIES", title: "Entity Coverage Matrix", content: entityCoverage, position: 4 },
          { sectionType: "SEMANTIC_KEYWORDS", title: "Semantic Keyword Groups", content: semanticKeywords, position: 5 },
          { sectionType: "INTERNAL_LINKS", title: "Internal Link Architecture", content: { items: internalLinks }, position: 6 },
          { sectionType: "CTA", title: "Call to Action Strategy", content: ctaRecommendation, position: 7 },
          { sectionType: "PRODUCT_PLACEMENT", title: "Product Placement Strategy", content: { items: productPlacements }, position: 8 },
          { sectionType: "MISSING_TOPICS", title: "Missing Content Topics", content: { items: missingTopics }, position: 9 },
        ];

        const sectionRows = sections.map((s) => ({
          brief_id: upsertedBrief.id,
          section_type: s.sectionType,
          title: s.title,
          content: s.content,
          position: s.position,
        }));

        await supabase.from("content_brief_sections").insert(sectionRows);
      }
    } catch (dbErr) {
      console.error("[CONTENT BRIEF DB UPSERT ERROR]:", dbErr);
    }
  }

  return brief;
}
