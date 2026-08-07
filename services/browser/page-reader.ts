"use server";

/**
 * services/browser/page-reader.ts
 *
 * Web Page Reader & Markdown Extractor
 * Navigates to target web page, strips scripts/styles, extracts clean readable content,
 * meta details, headers, and links formatted in clean Markdown.
 */

import { withBrowserPage } from "./browser-service";

export interface PageReaderResult {
  url: string;
  title: string;
  metaDescription: string;
  markdownContent: string;
  links: Array<{ text: string; href: string }>;
  success: boolean;
  error?: string;
}

export async function readWebsiteContent(targetUrl: string): Promise<PageReaderResult> {
  const formattedUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;

  const res = await withBrowserPage(async (page) => {
    await page.goto(formattedUrl, { waitUntil: "domcontentloaded", timeout: 20000 });

    const title = await page.title();
    const metaDescription = await page
      .locator('meta[name="description"]')
      .getAttribute("content")
      .catch(() => "");

    // Extract text content from main body, removing noise
    const bodyText = await page.evaluate(() => {
      const scripts = document.querySelectorAll("script, style, noscript, nav, footer, svg");
      scripts.forEach((s) => s.remove());
      const mainEl = (document.querySelector("main, article") || document.body) as HTMLElement | null;
      return mainEl?.innerText || document.body.innerText || "";
    });

    // Extract visible links
    const rawLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll("a[href]")).slice(0, 15);
      return anchors.map((a) => ({
        text: (a.textContent || "").trim(),
        href: (a as HTMLAnchorElement).href,
      })).filter((l) => l.text && l.href.startsWith("http"));
    });

    const cleanText = bodyText
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 200)
      .join("\n");

    const markdownContent = `# ${title || formattedUrl}\n\n${
      metaDescription ? `> Meta: ${metaDescription}\n\n` : ""
    }${cleanText}`;

    return {
      title,
      metaDescription: metaDescription || "",
      markdownContent,
      links: rawLinks,
    };
  });

  if (res.success && res.data) {
    return {
      url: formattedUrl,
      title: res.data.title,
      metaDescription: res.data.metaDescription,
      markdownContent: res.data.markdownContent,
      links: res.data.links,
      success: true,
    };
  }

  // Fallback: Pure HTTP fetch if Playwright browser launch is unavailable
  try {
    const fetchRes = await fetch(formattedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const htmlText = await fetchRes.text();
    const titleMatch = htmlText.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : formattedUrl;
    const cleanText = htmlText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").substring(0, 1500);

    return {
      url: formattedUrl,
      title,
      metaDescription: "",
      markdownContent: `# ${title}\n\n${cleanText}`,
      links: [],
      success: true,
    };
  } catch (fetchErr: unknown) {
    const errorMsg = fetchErr instanceof Error ? fetchErr.message : "HTTP Fetch failed";
    return {
      url: formattedUrl,
      title: formattedUrl,
      metaDescription: "",
      markdownContent: `Failed to read website content from ${formattedUrl}`,
      links: [],
      success: false,
      error: res.error || errorMsg,
    };
  }
}
