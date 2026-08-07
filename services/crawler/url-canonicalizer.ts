/**
 * services/crawler/url-canonicalizer.ts
 *
 * URL Canonicalization & Normalization Utility.
 * Ensures URLs matching http/https, www/non-www, trailing slashes, index files,
 * and tracking parameters (utm, fbclid, gclid) map to identical canonical strings.
 */

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "msclkid",
  "ref",
  "_ga",
]);

export function canonicalizeUrl(rawUrl: string, baseUrl?: string): string {
  if (!rawUrl) return "";

  try {
    const parsed = new URL(rawUrl, baseUrl);

    // 1. Lowercase scheme and hostname
    let hostname = parsed.hostname.toLowerCase();

    // Remove www prefix
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }

    let pathname = parsed.pathname;

    // 2. Remove default index filenames
    pathname = pathname.replace(/\/(index|default)\.(html?|php|asp[x]?)$/i, "/");

    // 3. Remove trailing slash if path is longer than /
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    // 4. Filter tracking query parameters & sort remaining params
    const searchParams = new URLSearchParams(parsed.search);
    const cleanParams = new URLSearchParams();

    const sortedKeys = Array.from(searchParams.keys()).sort();
    for (const key of sortedKeys) {
      if (!TRACKING_PARAMS.has(key.toLowerCase())) {
        const values = searchParams.getAll(key);
        for (const val of values) {
          cleanParams.append(key, val);
        }
      }
    }

    const queryString = cleanParams.toString() ? `?${cleanParams.toString()}` : "";

    return `${parsed.protocol.toLowerCase()}//${hostname}${pathname}${queryString}`;
  } catch {
    return rawUrl.trim();
  }
}

export function isSameDomain(urlA: string, urlB: string): boolean {
  try {
    const hostA = new URL(canonicalizeUrl(urlA)).hostname;
    const hostB = new URL(canonicalizeUrl(urlB)).hostname;
    return hostA === hostB;
  } catch {
    return false;
  }
}
