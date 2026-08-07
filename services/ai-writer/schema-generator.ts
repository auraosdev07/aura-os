/**
 * services/ai-writer/schema-generator.ts
 *
 * Schema Generator for Phase 4B.5A AI Writer Engine.
 * Produces valid JSON-LD structured data (Article, FAQPage, Product, BreadcrumbList, HowTo).
 */

import type { SEOContentBrief } from "@/services/content-strategy/types";
import type { FinalFAQPair } from "./faq-generator";

export function generateArticleSchema(
  brief: SEOContentBrief,
  metaTitle: string,
  slug: string,
  faqs: FinalFAQPair[]
): string[] {
  const domain = "https://auraos.dev";
  const pageUrl = `${domain}/articles/${slug}`;
  const schemaList: string[] = [];

  // 1. BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": domain },
      { "@type": "ListItem", "position": 2, "name": "Crystal Guides", "item": `${domain}/guides` },
      { "@type": "ListItem", "position": 3, "name": metaTitle, "item": pageUrl },
    ],
  };
  schemaList.push(JSON.stringify(breadcrumbSchema));

  // 2. Article Schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": metaTitle,
    "description": `Comprehensive guide covering benefits, authenticity testing, and buying advice for ${brief.keyword}.`,
    "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl },
    "author": { "@type": "Organization", "name": "Aura OS Editorial Team" },
    "publisher": { "@type": "Organization", "name": "Aura OS", "logo": { "@type": "ImageObject", "url": `${domain}/logo.png` } },
    "datePublished": new Date().toISOString().slice(0, 10),
  };
  schemaList.push(JSON.stringify(articleSchema));

  // 3. FAQPage Schema
  if (faqs.length > 0) {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((f) => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": { "@type": "Answer", "text": f.answer },
      })),
    };
    schemaList.push(JSON.stringify(faqSchema));
  }

  return schemaList;
}
