/**
 * services/collectors/website-collector.ts
 *
 * Website Data Collector Implementation (Phase 4A Module 6).
 * Wraps UniversalCrawlerService to execute website data collection.
 */

import { crawlerService } from "@/services/crawler/crawler-service";
import type { DataCollector, CollectionParams, CollectionResult, CollectedItem } from "./types";

export class WebsiteCollector implements DataCollector {
  public sourceType = "WEBSITE" as const;

  public async collect(params: CollectionParams): Promise<CollectionResult> {
    const startTime = Date.now();

    const job = await crawlerService.crawl(params.target, {
      maxDepth: params.maxDepth ?? 2,
      maxPages: params.maxItems ?? 20,
    });

    const results = await crawlerService.getResults(job.id);

    const items: CollectedItem[] = results.pages.map((p) => ({
      id: p.id,
      title: p.title || p.url,
      sourceUrl: p.url,
      content: p.meta_description || p.title || p.url,
      metadata: {
        statusCode: p.status_code,
        canonical: p.canonical,
        wordCount: p.word_count,
        h1Tags: p.h1_tags,
        h2Tags: p.h2_tags,
        depth: p.depth,
      },
    }));

    return {
      sourceType: "WEBSITE",
      target: params.target,
      itemCount: items.length,
      items,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

export const websiteCollector = new WebsiteCollector();
