/**
 * services/crawler/sitemap-parser.ts
 *
 * Sitemap XML Parser Module.
 * Fetches and parses sitemap.xml files (and nested sitemap index files) to extract page URLs.
 */

import { canonicalizeUrl } from "./url-canonicalizer";

export async function fetchAndParseSitemap(
  sitemapUrl: string,
  userAgent = "AuraOSBot"
): Promise<string[]> {
  const discoveredUrls: string[] = [];

  try {
    const res = await fetch(sitemapUrl, {
      headers: { "User-Agent": userAgent },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];

    const xmlText = await res.text();

    // Regex match <loc>...</loc> tags
    const locMatches = xmlText.match(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi);
    if (!locMatches) return [];

    for (const match of locMatches) {
      const cleanLoc = match.replace(/<\/?loc>/gi, "").trim();
      if (!cleanLoc) continue;

      // Handle sitemap index recursions if <loc> ends with .xml
      if (cleanLoc.endsWith(".xml") && cleanLoc !== sitemapUrl) {
        try {
          const subUrls = await fetchAndParseSitemap(cleanLoc, userAgent);
          discoveredUrls.push(...subUrls);
        } catch {
          // Ignore sub-sitemap error
        }
      } else {
        const canonical = canonicalizeUrl(cleanLoc);
        if (canonical) discoveredUrls.push(canonical);
      }
    }

    return Array.from(new Set(discoveredUrls));
  } catch {
    return [];
  }
}
