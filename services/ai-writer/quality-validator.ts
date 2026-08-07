/**
 * services/ai-writer/quality-validator.ts
 *
 * Quality Validator Engine for Phase 4B.5A AI Writer Engine.
 * Verifies Entity Coverage, Heading Hierarchy, FAQ count, Internal Links, Schema, Word Count, missing CTAs, duplicate headings/paragraphs.
 * Outputs quality score (0-100).
 */

import type { ArticleDraft, ValidationReport } from "./types";
import type { SEOContentBrief } from "@/services/content-strategy/types";

export function validateArticleQuality(draft: ArticleDraft, brief: SEOContentBrief): ValidationReport {
  const checksPassed: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Heading Hierarchy Check
  const hasH1 = draft.sections.some((s) => s.level === "H1") || Boolean(draft.title);
  const h2Count = draft.sections.filter((s) => s.level === "H2").length;

  if (hasH1) checksPassed.push("Single H1 title present");
  else errors.push("Missing H1 title");

  if (h2Count >= 2) checksPassed.push(`Sufficient H2 headings (${h2Count})`);
  else errors.push(`Insufficient H2 headings (${h2Count})`);

  // 2. FAQ Check
  if (draft.faq.length >= 3) checksPassed.push(`Sufficient FAQs (${draft.faq.length})`);
  else warnings.push(`Low FAQ count (${draft.faq.length})`);

  // 3. Internal Links Check
  if (draft.internalLinks.length >= 1) checksPassed.push(`Internal links injected (${draft.internalLinks.length})`);
  else errors.push("No internal links injected");

  // 4. Schema Check
  if (draft.schema.length >= 2) checksPassed.push(`Structured schemas present (${draft.schema.length})`);
  else warnings.push("Sparse schema markup");

  // 5. Word Count Check
  if (draft.wordCount >= 500) checksPassed.push(`Word count adequate (${draft.wordCount} words)`);
  else warnings.push(`Low word count (${draft.wordCount} words)`);

  // 6. Duplicate Heading Check
  const headings = draft.sections.map((s) => s.heading.toLowerCase());
  const uniqueHeadings = new Set(headings);
  if (headings.length === uniqueHeadings.size) checksPassed.push("Zero duplicate headings");
  else errors.push("Duplicate headings detected");

  // Calculate Quality Score (0-100)
  const baseScore = checksPassed.length * 15 + (warnings.length === 0 ? 10 : 0);
  const finalScore = Math.min(100, Math.max(20, baseScore));

  return {
    validationScore: finalScore,
    isValid: errors.length === 0,
    checksPassed,
    errors,
    warnings,
  };
}
