/**
 * services/product-seo/schema-engine.ts
 *
 * Schema Engine for Product SEO.
 * Generates JSON-LD for Product, BreadcrumbList, FAQPage.
 */

import type { SEOContentBrief } from "@/services/content-strategy/types";
import type { ProductFAQItem } from "./types";

export function generateProductSchemas(
  productId: string,
  brief: SEOContentBrief,
  metaTitle: string,
  slug: string,
  faqs: ProductFAQItem[]
): Record<string, unknown>[] {
  const domain = "https://auraos.dev";
  const pageUrl = `${domain}/products/${slug}`;

  // 1. Product Schema
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "productID": productId,
    "name": metaTitle,
    "image": [`${domain}/images/products/${productId}-main.jpg`],
    "description": `Original lab-certified natural ${brief.keyword} bracelet.`,
    "sku": `SKU-${productId.toUpperCase()}`,
    "brand": { "@type": "Brand", "name": "Aura OS Gemstones" },
    "offers": {
      "@type": "Offer",
      "url": pageUrl,
      "priceCurrency": "INR",
      "price": "1499",
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "128",
    },
  };

  // 2. Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": domain },
      { "@type": "ListItem", "position": 2, "name": "Crystal Bracelets", "item": `${domain}/products` },
      { "@type": "ListItem", "position": 3, "name": metaTitle, "item": pageUrl },
    ],
  };

  // 3. FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": { "@type": "Answer", "text": f.answer },
    })),
  };

  return [productSchema, breadcrumbSchema, faqSchema];
}
