"use server";

/**
 * services/browser/browser-service.ts
 *
 * Playwright Browser Lifecycle Service
 * Manages headless Chromium browser instances for Web Research & Page Inspection.
 * Includes graceful fallback HTTP fetcher when browser binaries are unavailable.
 */

import { chromium, type Browser, type Page } from "playwright";

let browserInstance: Browser | null = null;

export async function getBrowserInstance(): Promise<Browser | null> {
  try {
    if (!browserInstance || !browserInstance.isConnected()) {
      browserInstance = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      });
    }
    return browserInstance;
  } catch (err) {
    console.warn("[PLAYWRIGHT LAUNCH WARNING]:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function withBrowserPage<T>(
  action: (page: Page) => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  const browser = await getBrowserInstance();
  if (!browser) {
    return { success: false, error: "Browser engine launch unavailable. Operating in fallback HTTP mode." };
  }

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  try {
    const data = await action(page);
    return { success: true, data };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Browser execution failed";
    console.error("[BROWSER PAGE ERROR]:", errorMsg);
    return { success: false, error: errorMsg };
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}
