/**
 * services/crawler/types.ts
 *
 * Types and Contracts for Phase 4A.5 Hardened Web Crawler.
 */

export interface CrawlJobRow {
  id: string;
  owner_id: string | null;
  target_url: string;
  status: "PENDING" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED" | "CANCELLED";
  max_depth: number;
  max_pages: number;
  pages_crawled: number;
  sitemap_found: boolean;
  robots_found: boolean;
  error_message: string | null;
  version: number;
  parent_job_id: string | null;
  pages_per_second: number;
  average_response_time_ms: number;
  skipped_pages: number;
  unchanged_pages: number;
  rendered_pages: number;
  retry_count: number;
  duplicate_count: number;
  created_at: string;
  updated_at: string;
}

export interface CrawlPageRow {
  id: string;
  job_id: string;
  url: string;
  status_code: number;
  final_url: string;
  redirect_chain: string[];
  title: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical: string | null;
  language: string | null;
  word_count: number;
  reading_time_minutes: number;
  h1_tags: string[];
  h2_tags: string[];
  h3_tags: string[];
  h4_tags: string[];
  h5_tags: string[];
  h6_tags: string[];
  opengraph: Record<string, string>;
  twitter_cards: Record<string, string>;
  json_ld: Record<string, unknown>[];
  page_size_bytes: number;
  content_type: string | null;
  response_time_ms: number;
  depth: number;
  content_hash: string | null;
  etag: string | null;
  last_modified: string | null;
  is_unchanged: boolean;
  version: number;
  fingerprint: string | null;
  is_rendered: boolean;
  created_at: string;
}

export interface CrawlLinkRow {
  id: string;
  job_id: string;
  source_page_id: string;
  target_url: string;
  anchor_text: string | null;
  is_internal: boolean;
  is_nofollow: boolean;
  is_ugc: boolean;
  is_sponsored: boolean;
  created_at: string;
}

export interface CrawlImageRow {
  id: string;
  job_id: string;
  page_id: string;
  src: string;
  alt_text: string | null;
  created_at: string;
}

export interface CrawlMetadataRow {
  id: string;
  job_id: string;
  page_id: string;
  key: string;
  value: string | null;
  created_at: string;
}

export interface CrawlOptions {
  maxDepth?: number;
  maxPages?: number;
  timeoutMs?: number;
  rateLimitMs?: number;
  respectRobots?: boolean;
  useSitemap?: boolean;
  forceRender?: boolean;
}

export interface ExtractedLink {
  targetUrl: string;
  canonicalUrl: string;
  anchorText: string;
  isInternal: boolean;
  isNofollow: boolean;
  isUgc: boolean;
  isSponsored: boolean;
}

export interface ExtractedImage {
  src: string;
  altText: string;
}

export interface ParsedHTMLPage {
  url: string;
  statusCode: number;
  finalUrl: string;
  redirectChain: string[];
  title: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonical: string | null;
  language: string | null;
  wordCount: number;
  readingTimeMinutes: number;
  h1Tags: string[];
  h2Tags: string[];
  h3Tags: string[];
  h4Tags: string[];
  h5Tags: string[];
  h6Tags: string[];
  openGraph: Record<string, string>;
  twitterCards: Record<string, string>;
  jsonLd: Record<string, unknown>[];
  images: ExtractedImage[];
  links: ExtractedLink[];
  pageSizeBytes: number;
  contentType: string | null;
  responseTimeMs: number;
  depth: number;
  contentHash: string;
  etag: string | null;
  lastModified: string | null;
  fingerprint: string;
  isUnchanged: boolean;
  isRendered: boolean;
  version: number;
  rawHtml: string;
}

export interface RobotsTxtRules {
  allowedPaths: string[];
  disallowedPaths: string[];
  sitemaps: string[];
  crawlDelayMs: number;
}

export interface LinkGraphNode {
  pageId: string;
  url: string;
  depth: number;
  parentUrl: string | null;
  childrenUrls: string[];
  incomingLinksCount: number;
  outgoingLinksCount: number;
  anchorTexts: string[];
}

export interface ICrawlerService {
  crawl(url: string, options?: CrawlOptions): Promise<CrawlJobRow>;
  pause(jobId: string): Promise<CrawlJobRow>;
  resume(jobId: string): Promise<CrawlJobRow>;
  cancel(jobId: string): Promise<void>;
  getStatus(jobId: string): Promise<CrawlJobRow | null>;
  getResults(jobId: string): Promise<{
    job: CrawlJobRow;
    pages: CrawlPageRow[];
    links: CrawlLinkRow[];
    images: CrawlImageRow[];
    linkGraph: Record<string, LinkGraphNode>;
  }>;
}
