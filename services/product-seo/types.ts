/**
 * services/product-seo/types.ts
 *
 * Type definitions for Phase 5.1 Product SEO Engine.
 */

export interface ProductBenefitItem {
  title: string;
  description: string;
  category: "BENEFIT" | "HEALING_USE" | "SPECIFICATION";
  position: number;
}

export interface ProductCareGuideItem {
  title: string;
  instructions: string;
  position: number;
}

export interface ProductFAQItem {
  question: string;
  answer: string;
  position: number;
}

export interface ProductImagePlanItem {
  heading: string;
  prompt: string;
  altText: string;
  caption: string;
  placement: string;
  position: number;
}

export interface ProductInternalLinkItem {
  anchorText: string;
  destinationUrl: string;
  placementContext: string;
}

export interface ProductSEOValidationReport {
  validationScore: number;
  isValid: boolean;
  checksPassed: string[];
  errors: string[];
  warnings: string[];
}

export interface ProductSEOPlan {
  productId: string;
  keyword: string;
  targetCountry: string;
  suggestedTitles: string[];
  benefitStructure: string[];
  careTopics: string[];
  faqQuestions: string[];
  internalLinkAnchors: string[];
}

export interface ProductSEOProfile {
  id?: string;
  productId: string;
  keyword: string;
  normalizedKeyword: string;
  country: string;
  seoTitle: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  seoScore: number;
  validationScore: number;
  benefits: ProductBenefitItem[];
  careGuides: ProductCareGuideItem[];
  faqs: ProductFAQItem[];
  schemas: Record<string, unknown>[];
  imagePlan: ProductImagePlanItem[];
  internalLinks: ProductInternalLinkItem[];
  editorialQueueId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSEOResult {
  success: boolean;
  profile: ProductSEOProfile;
  validationReport: ProductSEOValidationReport;
  editorialQueueId?: string;
  knowledgeDocumentId?: string;
}
