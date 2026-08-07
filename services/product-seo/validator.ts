/**
 * services/product-seo/validator.ts
 *
 * Validator for Product SEO Engine.
 * Verifies titles, descriptions, benefits, FAQs, schema, internal links, image plan.
 */

import type { ProductSEOProfile, ProductSEOValidationReport } from "./types";

export function validateProductSEOProfile(profile: ProductSEOProfile): ProductSEOValidationReport {
  const checksPassed: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (profile.metaTitle && profile.metaTitle.length <= 60) checksPassed.push("Meta title character length optimal (<=60)");
  else errors.push("Meta title missing or exceeds 60 characters");

  if (profile.metaDescription && profile.metaDescription.length <= 155) checksPassed.push("Meta description character length optimal (<=155)");
  else errors.push("Meta description missing or exceeds 155 characters");

  if (profile.shortDescription && profile.longDescription) checksPassed.push("Short and long descriptions generated");
  else errors.push("Missing product description copy");

  if (profile.benefits.length >= 3) checksPassed.push(`Sufficient benefit blocks (${profile.benefits.length})`);
  else errors.push("Insufficient product benefit blocks");

  if (profile.faqs.length >= 3) checksPassed.push(`Sufficient product FAQs (${profile.faqs.length})`);
  else warnings.push("Low product FAQ count");

  if (profile.schemas.length >= 2) checksPassed.push(`Structured product schemas generated (${profile.schemas.length})`);
  else errors.push("Missing required JSON-LD schemas");

  if (profile.internalLinks.length >= 1) checksPassed.push(`Internal link recommendations present (${profile.internalLinks.length})`);
  else warnings.push("No internal link recommendations");

  if (profile.imagePlan.length >= 3) checksPassed.push(`Product image plan complete (${profile.imagePlan.length})`);
  else errors.push("Incomplete product image plan");

  const score = checksPassed.length * 12.5;

  return {
    validationScore: Math.min(100, Math.max(0, score)),
    isValid: errors.length === 0,
    checksPassed,
    errors,
    warnings,
  };
}
