/**
 * services/crawler/crawler-service.ts
 *
 * Universal Web Crawler Core Service (Phase 4A.5 Hardened & Analytics-Driven).
 * Implements ICrawlerService interface.
 * Standardized Crawl Pipeline:
 * 1. HTTP Fetch (Fetch with Retry) -> 2. HTML Parse (Playwright Fallback if Insufficient) -> 3. Link Extraction -> 4. Metadata Extraction -> 5. Queue Discovery -> 6. Database Storage -> 7. Knowledge Integration
 *
 * Features:
 * - Shared Playwright Pool rendering fallback
 * - Centralized CRAWLER_CONFIG
 * - Crawl Fingerprint Engine
 * - Crawl Analytics Persistence (pages_per_second, average_response_time_ms, skipped_pages, unchanged_pages, rendered_pages, retry_count, duplicate_count)
 * - Incremental Crawling & Crawl History Versioning
 * - Crawl Queue Control (Pause / Resume / Cancel / Status)
 */

import { CRAWLER_CONFIG } from "./config";
import { generateCrawlFingerprint } from "./fingerprint";
import { fetchAndParseRobotsTxt, isUrlAllowedByRobots } from "./robots-parser";
import { fetchAndParseSitemap } from "./sitemap-parser";
import { parseHTML } from "./html-parser";
import { canonicalizeUrl, isSameDomain } from "./url-canonicalizer";
import { LinkGraphBuilder } from "./link-graph";
import { fetchWithRetry } from "./fetch-with-retry";
import { isContentInsufficient, renderWithPlaywright } from "./playwright-renderer";
import {
  createCrawlJob,
  updateCrawlJob,
  saveCrawlPage,
  saveCrawlLinks,
  saveCrawlImages,
  getCrawlJobById,
  getCrawlResults,
  findPreviousPageByUrl,
} from "./crawl-storage";
import { saveCrawlPageToKnowledge } from "./crawler-knowledge-integration";
import type {
  ICrawlerService,
  CrawlJobRow,
  CrawlPageRow,
  CrawlLinkRow,
  CrawlImageRow,
  CrawlOptions,
  ParsedHTMLPage,
  LinkGraphNode,
} from "./types";

interface QueueItem {
  url: string;
  depth: number;
  parentUrl: string | null;
}

const activeJobs = new Map<string, { isCancelled: boolean; isPaused: boolean }>();

export class UniversalCrawlerService implements ICrawlerService {
  /** Standardized Crawl API */
  public async crawl(targetUrl: string, options?: CrawlOptions): Promise<CrawlJobRow> {
    const canonicalTarget = canonicalizeUrl(targetUrl);
    const maxDepth = options?.maxDepth ?? CRAWLER_CONFIG.DEFAULT_MAX_DEPTH;
    const maxPages = options?.maxPages ?? CRAWLER_CONFIG.DEFAULT_MAX_PAGES;
    const timeoutMs = options?.timeoutMs ?? CRAWLER_CONFIG.DEFAULT_TIMEOUT_MS;
    const rateLimitMs = options?.rateLimitMs ?? CRAWLER_CONFIG.DEFAULT_RATE_LIMIT_MS;
    const respectRobots = options?.respectRobots ?? true;
    const useSitemap = options?.useSitemap ?? true;
    const forceRender = options?.forceRender ?? false;

    // 1. Create Crawl Job in DB (calculates version & parent_job_id)
    const job = await createCrawlJob(canonicalTarget, maxDepth, maxPages);
    const jobId = job.id;
    activeJobs.set(jobId, { isCancelled: false, isPaused: false });

    // Run async background processing
    void this.processCrawlLoop({
      jobId,
      canonicalTarget,
      maxDepth,
      maxPages,
      timeoutMs,
      rateLimitMs,
      respectRobots,
      useSitemap,
      forceRender,
      parentJobId: job.parent_job_id,
      version: job.version,
    });

    return job;
  }

  /** Core Process Loop */
  private async processCrawlLoop(params: {
    jobId: string;
    canonicalTarget: string;
    maxDepth: number;
    maxPages: number;
    timeoutMs: number;
    rateLimitMs: number;
    respectRobots: boolean;
    useSitemap: boolean;
    forceRender: boolean;
    parentJobId: string | null;
    version: number;
  }) {
    const {
      jobId,
      canonicalTarget,
      maxDepth,
      maxPages,
      timeoutMs,
      rateLimitMs,
      respectRobots,
      useSitemap,
      forceRender,
      parentJobId,
      version,
    } = params;

    const visitedUrls = new Set<string>();
    const contentHashes = new Set<string>();
    const linkGraphBuilder = new LinkGraphBuilder();
    const queue: QueueItem[] = [{ url: canonicalTarget, depth: 0, parentUrl: null }];

    let sitemapFound = false;
    let robotsFound = false;
    let pagesCrawledCount = 0;

    // Analytics Metrics Counters
    const startTimeMs = Date.now();
    let totalResponseTimeMs = 0;
    let skippedPages = 0;
    let unchangedPages = 0;
    let renderedPages = 0;
    let retryCount = 0;
    let duplicateCount = 0;

    try {
      // 1. Fetch Robots.txt rules & directives
      const origin = new URL(canonicalTarget).origin;
      const robotsRules = await fetchAndParseRobotsTxt(origin, CRAWLER_CONFIG.USER_AGENT);
      robotsFound = robotsRules.disallowedPaths.length > 0 || robotsRules.sitemaps.length > 0;

      // 2. Fetch Sitemap URLs if requested & available
      if (useSitemap) {
        const sitemapUrlsToFetch =
          robotsRules.sitemaps.length > 0 ? robotsRules.sitemaps : [`${origin}/sitemap.xml`];

        for (const sMapUrl of sitemapUrlsToFetch) {
          const discovered = await fetchAndParseSitemap(sMapUrl, CRAWLER_CONFIG.USER_AGENT);
          if (discovered.length > 0) {
            sitemapFound = true;
            for (const sUrl of discovered) {
              if (isSameDomain(canonicalTarget, sUrl) && !visitedUrls.has(sUrl)) {
                queue.push({ url: sUrl, depth: 1, parentUrl: canonicalTarget });
              }
            }
          }
        }
      }

      await updateCrawlJob(jobId, {
        sitemap_found: sitemapFound,
        robots_found: robotsFound,
      });

      // 3. Processing Queue Pipeline
      while (queue.length > 0 && pagesCrawledCount < maxPages) {
        const jobControl = activeJobs.get(jobId);
        if (jobControl?.isCancelled) {
          await updateCrawlJob(jobId, { status: "CANCELLED" });
          return;
        }
        if (jobControl?.isPaused) {
          await updateCrawlJob(jobId, { status: "PAUSED" });
          return;
        }

        const item = queue.shift()!;
        const currentUrl = canonicalizeUrl(item.url);

        if (visitedUrls.has(currentUrl) || item.depth > maxDepth) {
          if (visitedUrls.has(currentUrl)) duplicateCount++;
          else skippedPages++;
          continue;
        }

        // Task Safety Check: Robots.txt Disallow Rules
        if (respectRobots && !isUrlAllowedByRobots(currentUrl, robotsRules)) {
          skippedPages++;
          console.log(`[CRAWLER] URL Disallowed by robots.txt: ${currentUrl}`);
          continue;
        }

        visitedUrls.add(currentUrl);

        // Rate limiting delay
        if (rateLimitMs > 0 && pagesCrawledCount > 0) {
          await new Promise((resolve) => setTimeout(resolve, rateLimitMs));
        }

        // Step 1: HTTP Fetch with Exponential Backoff Retry System
        const pageFetchStartTime = Date.now();
        let parsedPage: ParsedHTMLPage | null = null;
        let isRendered = false;

        try {
          const redirectChain: string[] = [];
          const { response: res, attempts } = await fetchWithRetry(currentUrl, {
            headers: { "User-Agent": CRAWLER_CONFIG.USER_AGENT },
            signal: AbortSignal.timeout(timeoutMs),
            redirect: "follow",
          });

          if (attempts > 1) {
            retryCount += attempts - 1;
          }

          let responseTimeMs = Date.now() - pageFetchStartTime;
          const statusCode = res.status;
          const finalUrl = canonicalizeUrl(res.url);
          const contentType = res.headers.get("content-type");
          const etag = res.headers.get("etag");
          const lastModified = res.headers.get("last-modified");

          if (!res.ok) {
            skippedPages++;
            console.log(`[CRAWLER] HTTP ${statusCode} for ${currentUrl}`);
            continue;
          }

          let rawHtml = await res.text();

          // Step 2: Playwright Dynamic Rendering Fallback Check
          if (forceRender || isContentInsufficient(rawHtml)) {
            console.log(`[CRAWLER PLAYWRIGHT FALLBACK] Triggered for: ${currentUrl}`);
            try {
              const rendered = await renderWithPlaywright(currentUrl, timeoutMs);
              rawHtml = rendered.rawHtml;
              responseTimeMs = rendered.responseTimeMs;
              isRendered = true;
              renderedPages++;
            } catch (pErr) {
              console.error(`[PLAYWRIGHT RENDER FAILED] ${currentUrl}:`, pErr);
            }
          }

          const pageSizeBytes = Buffer.byteLength(rawHtml, "utf-8");

          // Step 3 & 4: HTML Parse, Link Extraction & Metadata Extraction
          const tempParsed = parseHTML({
            url: currentUrl,
            statusCode,
            finalUrl,
            redirectChain,
            rawHtml,
            pageSizeBytes,
            contentType,
            responseTimeMs,
            depth: item.depth,
            etag,
            lastModified,
            isRendered,
            version,
          });

          // Generate Crawl Fingerprint
          const fingerprint = generateCrawlFingerprint({
            url: currentUrl,
            contentHash: tempParsed.contentHash,
            etag,
            lastModified,
          });

          // Incremental Crawl Comparison against Previous Job Version
          let isUnchanged = false;
          if (parentJobId) {
            const previousPage = await findPreviousPageByUrl(parentJobId, currentUrl);
            if (
              previousPage &&
              (previousPage.fingerprint === fingerprint || previousPage.content_hash === tempParsed.contentHash)
            ) {
              isUnchanged = true;
              unchangedPages++;
              console.log(`[INCREMENTAL CRAWL] Unchanged content detected for ${currentUrl}`);
            }
          }

          parsedPage = parseHTML({
            url: currentUrl,
            statusCode,
            finalUrl,
            redirectChain,
            rawHtml,
            pageSizeBytes,
            contentType,
            responseTimeMs,
            depth: item.depth,
            etag,
            lastModified,
            fingerprint,
            isUnchanged,
            isRendered,
            version,
          });

          totalResponseTimeMs += responseTimeMs;
        } catch (fetchErr: unknown) {
          skippedPages++;
          const msg = fetchErr instanceof Error ? fetchErr.message : "Fetch error";
          console.error(`[CRAWLER FETCH ERROR] ${currentUrl}:`, msg);
          continue;
        }

        if (!parsedPage) continue;

        // Content Hash Deduplication
        if (contentHashes.has(parsedPage.contentHash)) {
          duplicateCount++;
          console.log(`[CRAWLER] Duplicate content hash skipped: ${currentUrl}`);
          continue;
        }
        contentHashes.add(parsedPage.contentHash);

        // Step 5: Queue Discovery for Internal Links
        for (const link of parsedPage.links) {
          if (
            link.isInternal &&
            !visitedUrls.has(link.canonicalUrl) &&
            item.depth + 1 <= maxDepth
          ) {
            queue.push({
              url: link.canonicalUrl,
              depth: item.depth + 1,
              parentUrl: currentUrl,
            });
          }
        }

        // Step 6: Database Storage (Normalized)
        const savedPage = await saveCrawlPage(jobId, parsedPage);
        await saveCrawlLinks(jobId, savedPage.id, parsedPage.links);
        await saveCrawlImages(jobId, savedPage.id, parsedPage.images);

        // Update Link Graph
        linkGraphBuilder.addPage(parsedPage, savedPage.id, item.parentUrl);

        // Step 7: Knowledge Engine Auto-Integration
        await saveCrawlPageToKnowledge(jobId, parsedPage);

        pagesCrawledCount++;

        // Calculate Analytics Metrics
        const elapsedSec = Math.max(0.1, (Date.now() - startTimeMs) / 1000);
        const pagesPerSecond = parseFloat((pagesCrawledCount / elapsedSec).toFixed(2));
        const averageResponseTimeMs = Math.round(totalResponseTimeMs / pagesCrawledCount);

        await updateCrawlJob(jobId, {
          pages_crawled: pagesCrawledCount,
          pages_per_second: pagesPerSecond,
          average_response_time_ms: averageResponseTimeMs,
          skipped_pages: skippedPages,
          unchanged_pages: unchangedPages,
          rendered_pages: renderedPages,
          retry_count: retryCount,
          duplicate_count: duplicateCount,
        });
      }

      const elapsedSec = Math.max(0.1, (Date.now() - startTimeMs) / 1000);
      const pagesPerSecond = parseFloat((pagesCrawledCount / elapsedSec).toFixed(2));
      const averageResponseTimeMs = pagesCrawledCount > 0 ? Math.round(totalResponseTimeMs / pagesCrawledCount) : 0;

      await updateCrawlJob(jobId, {
        status: "COMPLETED",
        pages_crawled: pagesCrawledCount,
        pages_per_second: pagesPerSecond,
        average_response_time_ms: averageResponseTimeMs,
        skipped_pages: skippedPages,
        unchanged_pages: unchangedPages,
        rendered_pages: renderedPages,
        retry_count: retryCount,
        duplicate_count: duplicateCount,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Crawl failed";
      console.error(`[CRAWL JOB EXCEPTION] Job ${jobId}:`, err);
      await updateCrawlJob(jobId, {
        status: "FAILED",
        error_message: errorMsg,
      });
    } finally {
      activeJobs.delete(jobId);
    }
  }

  /** Pauses a running crawl job */
  public async pause(jobId: string): Promise<CrawlJobRow> {
    const control = activeJobs.get(jobId);
    if (control) {
      control.isPaused = true;
    }
    return updateCrawlJob(jobId, { status: "PAUSED" });
  }

  /** Resumes a paused/failed crawl job */
  public async resume(jobId: string): Promise<CrawlJobRow> {
    const job = await getCrawlJobById(jobId);
    if (!job) throw new Error("Crawl job not found");

    if (job.status === "RUNNING") return job;

    await updateCrawlJob(jobId, { status: "RUNNING", error_message: null });
    activeJobs.set(jobId, { isCancelled: false, isPaused: false });

    void this.processCrawlLoop({
      jobId: job.id,
      canonicalTarget: job.target_url,
      maxDepth: job.max_depth,
      maxPages: job.max_pages,
      timeoutMs: CRAWLER_CONFIG.DEFAULT_TIMEOUT_MS,
      rateLimitMs: CRAWLER_CONFIG.DEFAULT_RATE_LIMIT_MS,
      respectRobots: true,
      useSitemap: true,
      forceRender: false,
      parentJobId: job.parent_job_id,
      version: job.version,
    });

    return job;
  }

  /** Cancels a running crawl job */
  public async cancel(jobId: string): Promise<void> {
    const control = activeJobs.get(jobId);
    if (control) {
      control.isCancelled = true;
    }
    await updateCrawlJob(jobId, { status: "CANCELLED" });
  }

  /** Returns job status */
  public async getStatus(jobId: string): Promise<CrawlJobRow | null> {
    return getCrawlJobById(jobId);
  }

  /** Returns full normalized crawl results & link graph */
  public async getResults(jobId: string): Promise<{
    job: CrawlJobRow;
    pages: CrawlPageRow[];
    links: CrawlLinkRow[];
    images: CrawlImageRow[];
    linkGraph: Record<string, LinkGraphNode>;
  }> {
    const results = await getCrawlResults(jobId);
    const linkGraphBuilder = new LinkGraphBuilder();

    // Reconstruct link graph from normalized DB rows
    for (const page of results.pages) {
      const pageLinks = results.links.filter((l) => l.source_page_id === page.id);

      const parsed: ParsedHTMLPage = {
        url: page.url,
        statusCode: page.status_code,
        finalUrl: page.final_url,
        redirectChain: page.redirect_chain || [],
        title: page.title,
        metaTitle: page.meta_title,
        metaDescription: page.meta_description,
        canonical: page.canonical,
        language: page.language,
        wordCount: page.word_count,
        readingTimeMinutes: page.reading_time_minutes,
        h1Tags: page.h1_tags || [],
        h2Tags: page.h2_tags || [],
        h3Tags: page.h3_tags || [],
        h4Tags: page.h4_tags || [],
        h5Tags: page.h5_tags || [],
        h6Tags: page.h6_tags || [],
        openGraph: page.opengraph || {},
        twitterCards: page.twitter_cards || {},
        jsonLd: page.json_ld || [],
        pageSizeBytes: page.page_size_bytes,
        contentType: page.content_type,
        responseTimeMs: page.response_time_ms,
        depth: page.depth,
        contentHash: page.content_hash || "",
        etag: page.etag,
        lastModified: page.last_modified,
        fingerprint: page.fingerprint || "",
        isUnchanged: page.is_unchanged || false,
        isRendered: page.is_rendered || false,
        version: page.version || 1,
        rawHtml: "",
        images: [],
        links: pageLinks.map((l) => ({
          targetUrl: l.target_url,
          canonicalUrl: l.target_url,
          anchorText: l.anchor_text || "",
          isInternal: l.is_internal,
          isNofollow: l.is_nofollow,
          isUgc: l.is_ugc,
          isSponsored: l.is_sponsored,
        })),
      };

      linkGraphBuilder.addPage(parsed, page.id, null);
    }

    return {
      ...results,
      linkGraph: linkGraphBuilder.getGraph(),
    };
  }
}

export const crawlerService = new UniversalCrawlerService();
