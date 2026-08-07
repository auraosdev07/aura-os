/**
 * services/crawler/html-parser.ts
 *
 * HTML & Metadata Parser Module (Phase 4A Step 3).
 * Extracts Title, Meta tags, Canonical, Language, Word count, Reading time, H1-H6 headers,
 * OpenGraph, Twitter cards, JSON-LD, Images with alt text, Internal/External links with rel attributes,
 * Content Hash, ETag, and Last-Modified headers.
 */

import type { ParsedHTMLPage, ExtractedLink, ExtractedImage } from "./types";
import { canonicalizeUrl, isSameDomain } from "./url-canonicalizer";

/** Simple Hash Helper */
function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

export function parseHTML(params: {
  url: string;
  statusCode: number;
  finalUrl: string;
  redirectChain: string[];
  rawHtml: string;
  pageSizeBytes: number;
  contentType: string | null;
  responseTimeMs: number;
  depth: number;
  etag?: string | null;
  lastModified?: string | null;
  fingerprint?: string;
  isUnchanged?: boolean;
  isRendered?: boolean;
  version?: number;
}): ParsedHTMLPage {
  const {
    url,
    statusCode,
    finalUrl,
    redirectChain,
    rawHtml,
    pageSizeBytes,
    contentType,
    responseTimeMs,
    depth,
    etag = null,
    lastModified = null,
    fingerprint = "",
    isUnchanged = false,
    isRendered = false,
    version = 1,
  } = params;

  const baseUrl = finalUrl || url;
  const contentHash = generateHash(rawHtml);

  // 1. Extract Title & Meta Title
  const titleMatch = rawHtml.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : null;

  const metaTitleMatch = rawHtml.match(/<meta\s+name=["']title["']\s+content=["']([\s\S]*?)["']/i) ||
    rawHtml.match(/<meta\s+property=["']og:title["']\s+content=["']([\s\S]*?)["']/i);
  const metaTitle = metaTitleMatch ? metaTitleMatch[1].trim() : title;

  // 2. Extract Meta Description
  const metaDescMatch = rawHtml.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i) ||
    rawHtml.match(/<meta\s+property=["']og:description["']\s+content=["']([\s\S]*?)["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : null;

  // 3. Extract Canonical URL
  const canonicalMatch = rawHtml.match(/<link\s+rel=["']canonical["']\s+href=["']([\s\S]*?)["']/i);
  const canonical = canonicalMatch ? canonicalizeUrl(canonicalMatch[1].trim(), baseUrl) : null;

  // 4. Extract Language
  const langMatch = rawHtml.match(/<html\b[^>]*\blang=["']([^"']+)["']/i);
  const language = langMatch ? langMatch[1].trim() : "en";

  // 5. Clean text for Word Count & Reading Time
  const cleanBodyText = rawHtml
    .replace(/<script\b[^<]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^<]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleanBodyText ? cleanBodyText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // 6. Extract H1-H6 Headers
  const extractHeaders = (tag: string): string[] => {
    const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
    const matches = rawHtml.match(regex) || [];
    return matches
      .map((m) => m.replace(/<[^>]*>/g, "").trim().replace(/\s+/g, " "))
      .filter(Boolean);
  };

  const h1Tags = extractHeaders("h1");
  const h2Tags = extractHeaders("h2");
  const h3Tags = extractHeaders("h3");
  const h4Tags = extractHeaders("h4");
  const h5Tags = extractHeaders("h5");
  const h6Tags = extractHeaders("h6");

  // 7. Extract OpenGraph Meta Tags
  const openGraph: Record<string, string> = {};
  const ogMatches = rawHtml.match(/<meta\s+property=["'](og:[^"']+)["']\s+content=["']([\s\S]*?)["']/gi) || [];
  for (const og of ogMatches) {
    const propMatch = og.match(/property=["'](og:[^"']+)["']/i);
    const valMatch = og.match(/content=["']([\s\S]*?)["']/i);
    if (propMatch && valMatch) {
      openGraph[propMatch[1].toLowerCase()] = valMatch[1].trim();
    }
  }

  // 8. Extract Twitter Card Meta Tags
  const twitterCards: Record<string, string> = {};
  const twMatches = rawHtml.match(/<meta\s+name=["'](twitter:[^"']+)["']\s+content=["']([\s\S]*?)["']/gi) || [];
  for (const tw of twMatches) {
    const nameMatch = tw.match(/name=["'](twitter:[^"']+)["']/i);
    const valMatch = tw.match(/content=["']([\s\S]*?)["']/i);
    if (nameMatch && valMatch) {
      twitterCards[nameMatch[1].toLowerCase()] = valMatch[1].trim();
    }
  }

  // 9. Extract JSON-LD Scripts
  const jsonLd: Record<string, unknown>[] = [];
  const jsonLdMatches = rawHtml.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi) || [];
  for (const script of jsonLdMatches) {
    const jsonStr = script.replace(/<\/?script[^>]*>/gi, "").trim();
    try {
      const parsed = JSON.parse(jsonStr);
      jsonLd.push(parsed);
    } catch {
      // Ignore malformed JSON-LD
    }
  }

  // 10. Extract Images
  const images: ExtractedImage[] = [];
  const imgMatches = rawHtml.match(/<img\b[^>]*>/gi) || [];
  for (const imgTag of imgMatches) {
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);

    if (srcMatch && srcMatch[1]) {
      try {
        const fullSrc = new URL(srcMatch[1], baseUrl).href;
        images.push({
          src: fullSrc,
          altText: altMatch ? altMatch[1].trim() : "",
        });
      } catch {
        // Ignore invalid image URL
      }
    }
  }

  // 11. Extract Links (Internal & External)
  const links: ExtractedLink[] = [];
  const anchorMatches = rawHtml.match(/<a\b[^>]*>([\s\S]*?)<\/a>/gi) || [];

  for (const anchor of anchorMatches) {
    const hrefMatch = anchor.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch || !hrefMatch[1]) continue;

    const rawHref = hrefMatch[1].trim();
    if (rawHref.startsWith("#") || rawHref.startsWith("javascript:") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
      continue;
    }

    try {
      const targetUrl = new URL(rawHref, baseUrl).href;
      const canonicalTarget = canonicalizeUrl(targetUrl);

      const anchorText = anchor.replace(/<[^>]*>/g, "").trim().replace(/\s+/g, " ");
      const isInternal = isSameDomain(baseUrl, canonicalTarget);

      const relMatch = anchor.match(/rel=["']([^"']+)["']/i);
      const relVal = relMatch ? relMatch[1].toLowerCase() : "";

      links.push({
        targetUrl,
        canonicalUrl: canonicalTarget,
        anchorText,
        isInternal,
        isNofollow: relVal.includes("nofollow"),
        isUgc: relVal.includes("ugc"),
        isSponsored: relVal.includes("sponsored"),
      });
    } catch {
      // Ignore invalid link URL
    }
  }

  return {
    url,
    statusCode,
    finalUrl,
    redirectChain,
    title,
    metaTitle,
    metaDescription,
    canonical,
    language,
    wordCount,
    readingTimeMinutes,
    h1Tags,
    h2Tags,
    h3Tags,
    h4Tags,
    h5Tags,
    h6Tags,
    openGraph,
    twitterCards,
    jsonLd,
    images,
    links,
    pageSizeBytes,
    contentType,
    responseTimeMs,
    depth,
    contentHash,
    etag,
    lastModified,
    fingerprint: fingerprint || `fp_${contentHash}`,
    isUnchanged,
    isRendered,
    version,
    rawHtml,
  };
}
