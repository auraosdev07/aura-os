/**
 * services/crawler/playwright-renderer.ts
 *
 * Shared Playwright Pool & Rendering Fallback Module (Phase 4A.5).
 * Uses a singleton Playwright BrowserContext pool instead of launching Chromium per page.
 * Renders SPA/JavaScript-heavy pages dynamically ONLY when raw HTML content is insufficient.
 */

import { chromium, type Browser, type BrowserContext } from "playwright";
import { CRAWLER_CONFIG } from "./config";

let sharedBrowser: Browser | null = null;
let sharedContext: BrowserContext | null = null;

export async function getSharedBrowserContext(): Promise<BrowserContext> {
  if (sharedContext && sharedBrowser?.isConnected()) {
    return sharedContext;
  }

  if (!sharedBrowser || !sharedBrowser.isConnected()) {
    sharedBrowser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  sharedContext = await sharedBrowser.newContext({
    userAgent: CRAWLER_CONFIG.USER_AGENT,
    viewport: { width: 1280, height: 800 },
  });

  return sharedContext;
}

export async function closeBrowserPool(): Promise<void> {
  if (sharedContext) {
    await sharedContext.close().catch(() => {});
    sharedContext = null;
  }
  if (sharedBrowser) {
    await sharedBrowser.close().catch(() => {});
    sharedBrowser = null;
  }
}

/** Determines if raw HTTP fetch HTML is insufficient and requires JS rendering */
export function isContentInsufficient(rawHtml: string): boolean {
  if (!rawHtml || rawHtml.length < CRAWLER_CONFIG.MIN_HTML_LENGTH) return true;

  const cleanBodyText = rawHtml
    .replace(/<script\b[^<]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^<]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanBodyText.length < CRAWLER_CONFIG.MIN_BODY_TEXT_LENGTH) {
    // Check if it's an unrendered SPA container
    if (/<div\s+id=["'](root|app|__next)["']\s*>\s*<\/div>/i.test(rawHtml)) {
      return true;
    }
  }

  return false;
}

/** Dynamically renders target URL with Playwright using shared pool */
export async function renderWithPlaywright(
  url: string,
  timeoutMs: number = CRAWLER_CONFIG.DEFAULT_TIMEOUT_MS
): Promise<{ rawHtml: string; responseTimeMs: number; statusCode: number }> {
  const startTime = Date.now();
  const context = await getSharedBrowserContext();
  const page = await context.newPage();

  try {
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
    });

    const statusCode = response ? response.status() : 200;
    const rawHtml = await page.content();
    const responseTimeMs = Date.now() - startTime;

    return { rawHtml, responseTimeMs, statusCode };
  } finally {
    await page.close().catch(() => {});
  }
}
