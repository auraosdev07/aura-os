/**
 * services/crawler/crawler-knowledge-integration.ts
 *
 * Crawler Knowledge Integration Module (Phase 4A Step 6).
 * Automatically creates or fetches the system Knowledge Collection "Web Crawls & Raw Site Data"
 * and inserts detailed KnowledgeDocument records containing extracted metadata, HTML, images, headings, and links.
 */

import { getCollections, createCollection, createDocument } from "@/services/knowledge-engine";
import type { ParsedHTMLPage } from "./types";

export async function saveCrawlPageToKnowledge(
  jobId: string,
  page: ParsedHTMLPage
): Promise<void> {
  try {
    // 1. Ensure system collection exists
    const collections = await getCollections();
    let systemColl = collections.find((c) => c.name === "Web Crawls & Raw Site Data");

    if (!systemColl) {
      systemColl = await createCollection({
        name: "Web Crawls & Raw Site Data",
        description: "Raw crawling metadata, HTML structural extraction, headings, links, and schemas.",
        type: "WEBSITE",
        tags: ["web_crawl", "raw_data", "seo"],
      });
    }

    // 2. Prepare structured raw content
    const headingText = [
      ...page.h1Tags.map((h) => `# ${h}`),
      ...page.h2Tags.map((h) => `## ${h}`),
      ...page.h3Tags.map((h) => `### ${h}`),
    ].join("\n");

    const imagesText = page.images.length > 0
      ? `\n\nExtracted Images (${page.images.length}):\n` + page.images.map((i) => `- ${i.src} (Alt: "${i.altText}")`).join("\n")
      : "";

    const linksText = page.links.length > 0
      ? `\n\nExtracted Links (${page.links.length}):\n` + page.links.slice(0, 30).map((l) => `- ${l.targetUrl} (Anchor: "${l.anchorText}")`).join("\n")
      : "";

    const fullContent = `URL: ${page.url}\nTitle: ${page.title || "Untitled"}\nCanonical: ${page.canonical || "N/A"}\nWord Count: ${page.wordCount}\nStatus: ${page.statusCode}\n\nHeadings:\n${headingText}${imagesText}${linksText}\n\nClean Body Sample:\n${page.rawHtml.replace(/<[^>]*>/g, " ").slice(0, 1500)}`;

    // 3. Create Knowledge Document
    await createDocument({
      collectionId: systemColl.id,
      title: page.title || `Crawled Page: ${page.url}`,
      source: page.url,
      rawContent: fullContent,
      summary: page.metaDescription || `Crawled page ${page.url} (${page.wordCount} words, ${page.links.length} links).`,
      tags: ["web_crawl", "crawled_page", `job_${jobId}`],
      language: page.language || "en",
    });
  } catch (err) {
    console.error("[CRAWL KNOWLEDGE INTEGRATION ERROR]:", err);
  }
}
