/**
 * services/publishing/provider-interface.ts
 *
 * Provider interface for Phase 5.0 Publishing Architecture.
 * Supports Markdown Export, HTML Export, JSON Export, WordPress, Shopify, Ghost, Notion.
 * NO provider-specific logic inside orchestrator.
 */

export interface PublishContentPayload {
  title: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  introduction: string;
  sections: Array<{ heading: string; level: string; content: string }>;
  faq: Array<{ question: string; answer: string }>;
  schema: string[];
  cta: Record<string, unknown>;
  internalLinks: Array<Record<string, unknown>>;
  imagePlan: Array<Record<string, unknown>>;
  qualityScore: number;
}

export interface PublishResult {
  success: boolean;
  publishedUrl?: string;
  publishedId?: string;
  exportedContent?: string;
  errorMessage?: string;
}

export interface PublishingProvider {
  id: string;
  name: string;
  type: "FILE_EXPORT" | "CMS_PLUGIN" | "ECOMMERCE_CMS" | "WORKSPACE_EXPORT";
  isEnabled(): boolean;
  publish(payload: PublishContentPayload, humanApprover: string): Promise<PublishResult>;
}
