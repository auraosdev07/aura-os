/**
 * services/ai-writer/types.ts
 *
 * Types for Phase 4B.5A Universal AI Writer Engine.
 */

import type { SEOContentBrief } from "@/services/content-strategy/types";

export interface ArticleSectionDraft {
  heading: string;
  level: "H1" | "H2" | "H3" | "H4";
  content: string;
  position: number;
}

export interface ImagePlanItem {
  heading: string;
  prompt: string;
  altText: string;
  caption: string;
  placement: string;
  position: number;
}

export interface InternalLinkPlacement {
  anchorText: string;
  destinationUrl: string;
  placementSection: string;
}

export interface ValidationReport {
  validationScore: number;
  isValid: boolean;
  checksPassed: string[];
  errors: string[];
  warnings: string[];
}

export interface WritingPlan {
  keyword: string;
  contentType: string;
  targetWordCount: number;
  sectionOrder: Array<{ heading: string; level: "H1" | "H2" | "H3" | "H4" }>;
  entityAllocation: Record<string, string[]>;
  keywordAllocation: Record<string, string[]>;
  internalLinkPlacements: InternalLinkPlacement[];
  productPlacements: Array<{ location: string; productType: string }>;
}

export interface ArticleDraft {
  id?: string;
  keyword: string;
  normalizedKeyword: string;
  country: string;
  provider: string;
  model: string;
  version: number;
  title: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  introduction: string;
  summary: string;
  wordCount: number;
  validationScore: number;
  sections: ArticleSectionDraft[];
  faq: Array<{ question: string; answer: string }>;
  schema: string[];
  cta: { ctaType: string; heading: string; description: string; buttonText: string };
  internalLinks: InternalLinkPlacement[];
  imageSuggestions: ImagePlanItem[];
  altTexts: string[];
  references: string[];
  knowledgeDocId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIWriterResult {
  success: boolean;
  draft: ArticleDraft;
  metadata: any;
  faq: Array<{ question: string; answer: string }>;
  schema: string[];
  imagePlan: ImagePlanItem[];
  internalLinks: InternalLinkPlacement[];
  validationReport: ValidationReport;
  qualityScore: number;
  writingPlan: WritingPlan;
  knowledgeDocument?: string;
}
