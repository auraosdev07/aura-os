/**
 * services/crawler/robots-parser.ts
 *
 * Robots.txt Parser & Compliance Module.
 * Parses robots.txt files, extracts Disallow/Allow paths, Crawl-delay, and Sitemap directives.
 */

import type { RobotsTxtRules } from "./types";
import { canonicalizeUrl } from "./url-canonicalizer";

export async function fetchAndParseRobotsTxt(
  baseUrl: string,
  userAgent = "AuraOSBot"
): Promise<RobotsTxtRules> {
  const defaultRules: RobotsTxtRules = {
    allowedPaths: [],
    disallowedPaths: [],
    sitemaps: [],
    crawlDelayMs: 0,
  };

  try {
    const origin = new URL(baseUrl).origin;
    const robotsUrl = `${origin}/robots.txt`;

    const res = await fetch(robotsUrl, {
      headers: { "User-Agent": userAgent },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return defaultRules;

    const text = await res.text();
    const lines = text.split(/\r?\n/);

    let isTargetUserAgent = false;
    let isGlobalUserAgent = false;

    const allowedPaths: string[] = [];
    const disallowedPaths: string[] = [];
    const sitemaps: string[] = [];
    let crawlDelayMs = 0;

    for (let rawLine of lines) {
      // Remove comments
      const hashIdx = rawLine.indexOf("#");
      if (hashIdx !== -1) rawLine = rawLine.substring(0, hashIdx);

      const line = rawLine.trim();
      if (!line) continue;

      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;

      const key = line.substring(0, colonIdx).trim().toLowerCase();
      const val = line.substring(colonIdx + 1).trim();

      if (key === "user-agent") {
        const agent = val.toLowerCase();
        isTargetUserAgent = agent === userAgent.toLowerCase() || agent === "*";
        isGlobalUserAgent = agent === "*";
        continue;
      }

      if (key === "sitemap" && val) {
        try {
          sitemaps.push(new URL(val, origin).href);
        } catch {
          // Ignore invalid sitemap URL
        }
      }

      if (isTargetUserAgent || isGlobalUserAgent) {
        if (key === "disallow" && val) {
          disallowedPaths.push(val);
        } else if (key === "allow" && val) {
          allowedPaths.push(val);
        } else if (key === "crawl-delay" && val) {
          const delaySec = parseFloat(val);
          if (!isNaN(delaySec)) crawlDelayMs = Math.round(delaySec * 1000);
        }
      }
    }

    return {
      allowedPaths,
      disallowedPaths,
      sitemaps: Array.from(new Set(sitemaps)),
      crawlDelayMs,
    };
  } catch {
    return defaultRules;
  }
}

export function isUrlAllowedByRobots(targetUrl: string, rules: RobotsTxtRules): boolean {
  try {
    const canonical = canonicalizeUrl(targetUrl);
    const parsed = new URL(canonical);
    const path = parsed.pathname;

    // Explicit Allow overrides Disallow if longer match
    for (const allow of rules.allowedPaths) {
      if (allow !== "/" && path.startsWith(allow)) return true;
    }

    for (const disallow of rules.disallowedPaths) {
      if (disallow === "/") return false;
      if (disallow && path.startsWith(disallow)) return false;
    }

    return true;
  } catch {
    return true;
  }
}
