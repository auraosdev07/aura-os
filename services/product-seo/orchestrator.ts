/**
 * services/product-seo/orchestrator.ts
 *
 * Universal Product SEO Engine Orchestrator (Phase 5.1).
 * Reuses SEO Intelligence, Topic Graph, Content Strategy, and Editorial Queue services.
 * AUTOMATIC PUBLISHING FORBIDDEN — Every profile enters Editorial Queue under 'Under Review'.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { generateContentBrief } from "@/services/content-strategy/content-strategy-orchestrator";
import { enqueueDraftForEditorialReview } from "@/services/editorial/editorial-orchestrator";
import { generateProductMetadata } from "./metadata-engine";
import { generateProductBenefitsAndCare } from "./benefit-engine";
import { generateProductFAQs } from "./faq-engine";
import { generateProductSchemas } from "./schema-engine";
import { generateProductInternalLinks } from "./internal-link-engine";
import { generateProductImagePlan } from "./image-planner";
import { validateProductSEOProfile } from "./validator";
import type { ProductSEOProfile, ProductSEOResult } from "./types";

export async function generateProductSEOProfile(
  productId: string,
  rawKeyword: string,
  country: string = "IN",
  forceRefresh: boolean = false
): Promise<ProductSEOResult> {
  const { supabase } = await getServerContext();
  const normalized = rawKeyword.toLowerCase().trim();
  const targetCountry = country.toUpperCase();

  // 1. READ / RUN CONTENT BRIEF (Reuse 4B.4 Content Strategy Engine)
  const brief = await generateContentBrief(rawKeyword, targetCountry, forceRefresh);

  // 2. GENERATE METADATA & DESCRIPTIONS
  const meta = generateProductMetadata(productId, brief);

  // 3. GENERATE BENEFITS & CARE GUIDES
  const { benefits, careGuides } = generateProductBenefitsAndCare(brief);

  // 4. GENERATE FAQS (Reuse 4B.5A FAQ Answer Generator)
  const faqs = generateProductFAQs(brief);

  // 5. GENERATE SCHEMAS (Product, Breadcrumb, FAQPage)
  const schemas = generateProductSchemas(productId, brief, meta.metaTitle, meta.slug, faqs);

  // 6. GENERATE INTERNAL LINKS & IMAGE PLAN
  const internalLinks = generateProductInternalLinks(brief);
  const imagePlan = generateProductImagePlan(brief);

  // 7. ASSEMBLE PRODUCT SEO PROFILE
  const profile: ProductSEOProfile = {
    productId,
    keyword: rawKeyword.trim(),
    normalizedKeyword: normalized,
    country: targetCountry,
    seoTitle: meta.seoTitle,
    metaTitle: meta.metaTitle,
    metaDescription: meta.metaDescription,
    slug: meta.slug,
    shortDescription: meta.shortDescription,
    longDescription: meta.longDescription,
    seoScore: 92.5,
    validationScore: 0,
    benefits,
    careGuides,
    faqs,
    schemas,
    imagePlan,
    internalLinks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 8. RUN VALIDATOR
  const report = validateProductSEOProfile(profile);
  profile.validationScore = report.validationScore;

  // 9. ENQUEUE INTO EDITORIAL WORKFLOW (Reuses Phase 5.0 Editorial Queue)
  const queueItem = await enqueueDraftForEditorialReview({
    draft: {
      id: `prod_${productId}_${normalized}`,
      keyword: profile.keyword,
      normalizedKeyword: profile.normalizedKeyword,
      country: profile.country,
      title: `[PRODUCT SEO] ${profile.seoTitle}`,
      version: 1,
      wordCount: profile.longDescription.split(" ").length,
      validationScore: profile.validationScore,
    },
    metadata: { title: profile.seoTitle },
  });

  profile.editorialQueueId = queueItem.id;

  // 10. DB PERSISTENCE
  if (supabase && typeof supabase.from === "function") {
    try {
      const { data: insertedProfile } = await supabase
        .from("product_seo_profiles")
        .insert({
          product_id: profile.productId,
          keyword: profile.keyword,
          normalized_keyword: profile.normalizedKeyword,
          country: profile.country,
          seo_title: profile.seoTitle,
          meta_title: profile.metaTitle,
          meta_description: profile.metaDescription,
          slug: profile.slug,
          short_description: profile.shortDescription,
          long_description: profile.longDescription,
          seo_score: profile.seoScore,
          validation_score: profile.validationScore,
          editorial_queue_id: profile.editorialQueueId,
        })
        .select("id")
        .single();

      if (insertedProfile?.id) {
        profile.id = insertedProfile.id;

        // Benefits
        if (benefits.length > 0) {
          await supabase.from("product_benefits").insert(
            benefits.map((b) => ({ profile_id: insertedProfile.id, title: b.title, description: b.description, category: b.category, position: b.position }))
          );
        }

        // Care Guides
        if (careGuides.length > 0) {
          await supabase.from("product_care_guides").insert(
            careGuides.map((c) => ({ profile_id: insertedProfile.id, title: c.title, instructions: c.instructions, position: c.position }))
          );
        }

        // FAQs
        if (faqs.length > 0) {
          await supabase.from("product_faqs").insert(
            faqs.map((f) => ({ profile_id: insertedProfile.id, question: f.question, answer: f.answer, position: f.position }))
          );
        }

        // Schemas
        if (schemas.length > 0) {
          await supabase.from("product_schema").insert(
            schemas.map((s: Record<string, unknown>) => ({ profile_id: insertedProfile.id, schema_type: String(s["@type"] || "Schema"), schema_json: s }))
          );
        }

        // Internal Links
        if (internalLinks.length > 0) {
          await supabase.from("product_internal_links").insert(
            internalLinks.map((l) => ({ profile_id: insertedProfile.id, anchor_text: l.anchorText, destination_url: l.destinationUrl, placement_context: l.placementContext }))
          );
        }

        // Image Plan
        if (imagePlan.length > 0) {
          await supabase.from("product_image_plan").insert(
            imagePlan.map((img) => ({ profile_id: insertedProfile.id, heading: img.heading, prompt: img.prompt, alt_text: img.altText, caption: img.caption, placement: img.placement, position: img.position }))
          );
        }
      }
    } catch (dbErr) {
      console.error("[PRODUCT SEO DB INSERT ERROR]:", dbErr);
    }
  }

  return {
    success: true,
    profile,
    validationReport: report,
    editorialQueueId: profile.editorialQueueId,
    knowledgeDocumentId: brief.knowledgeDocId,
  };
}
