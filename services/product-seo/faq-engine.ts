/**
 * services/product-seo/faq-engine.ts
 *
 * Reuses FAQ Answer Engine for Product SEO.
 */

import { generateFinalFAQs } from "@/services/ai-writer/faq-generator";
import type { SEOContentBrief } from "@/services/content-strategy/types";
import type { ProductFAQItem } from "./types";

export function generateProductFAQs(brief: SEOContentBrief): ProductFAQItem[] {
  const faqs = generateFinalFAQs(brief);
  return faqs.map((f, idx) => ({
    question: f.question,
    answer: f.answer,
    position: idx + 1,
  }));
}
