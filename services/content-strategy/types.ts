/**
 * services/content-strategy/types.ts
 *
 * Types and Data Contracts for Phase 4B.4 SEO Content Strategy Engine.
 */

export type ContentType =
  | "Buying Guide"
  | "Category Page"
  | "Educational Blog"
  | "Comparison Article"
  | "FAQ Article";

export interface TitleRecommendation {
  title: string;
  type: string;
}

export interface HeadingNode {
  level: "H1" | "H2" | "H3" | "H4";
  text: string;
  subheadings?: HeadingNode[];
}

export interface FAQItem {
  question: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  answerPlaceholder: string;
}

export interface EntityCoverage {
  primaryEntities: string[];
  secondaryEntities: string[];
  missingEntities: string[];
  requiredMentions: string[];
  entityDensityTarget: string; // e.g. "1.5% - 2.5%"
}

export interface SemanticKeywordGroup {
  primary: string[];
  secondary: string[];
  supporting: string[];
  longTail: string[];
  questionKeywords: string[];
  commercialKeywords: string[];
}

export interface InternalLinkSuggestion {
  sourceKeyword: string;
  targetKeyword: string;
  anchorText: string;
  reason: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface CTARecommendation {
  ctaType: "Soft CTA" | "Product Recommendation" | "Buy CTA";
  heading: string;
  description: string;
  buttonText: string;
}

export interface ProductPlacement {
  placementLocation: "After Benefits" | "After Buying Guide" | "Before FAQ" | "Conclusion";
  description: string;
  suggestedProductTypes: string[];
}

export interface ContentSection {
  sectionType:
    | "TITLE_IDEAS"
    | "HEADINGS"
    | "FAQS"
    | "ENTITIES"
    | "SEMANTIC_KEYWORDS"
    | "INTERNAL_LINKS"
    | "CTA"
    | "PRODUCT_PLACEMENT"
    | "MISSING_TOPICS"
    | "CONVERSION_OPPORTUNITIES";
  title: string;
  content: Record<string, any>;
  position: number;
}

export interface SEOContentBrief {
  id?: string;
  keyword: string;
  normalizedKeyword: string;
  country: string;
  clusterId?: string;
  intent: string;
  recommendedContentType: ContentType;
  recommendedWordCount: number;
  recommendedSchema: string[];
  briefScore: number;
  titleIdeas: TitleRecommendation[];
  headingTree: HeadingNode[];
  faqList: FAQItem[];
  entityCoverage: EntityCoverage;
  semanticKeywords: SemanticKeywordGroup;
  missingTopics: string[];
  internalLinks: InternalLinkSuggestion[];
  ctaRecommendation: CTARecommendation;
  productPlacements: ProductPlacement[];
  knowledgeDocId?: string;
  createdAt: string;
  updatedAt: string;
  isCached?: boolean;
}
