/**
 * services/crawler/fingerprint.ts
 *
 * Crawl Fingerprint Module (Phase 4A.5).
 * Generates composite fingerprint strings (canonical + content_hash + etag + last_modified)
 * for duplicate detection and incremental crawl matching.
 */

import { canonicalizeUrl } from "./url-canonicalizer";

export function generateCrawlFingerprint(params: {
  url: string;
  contentHash: string;
  etag?: string | null;
  lastModified?: string | null;
}): string {
  const canonical = canonicalizeUrl(params.url);
  const etagVal = params.etag ? params.etag.trim() : "no_etag";
  const lmVal = params.lastModified ? params.lastModified.trim() : "no_lm";

  const composite = `fp_${canonical}_${params.contentHash}_${etagVal}_${lmVal}`;

  let hash = 0;
  for (let i = 0; i < composite.length; i++) {
    const char = composite.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return `fp_${Math.abs(hash).toString(16)}_${params.contentHash}`;
}
