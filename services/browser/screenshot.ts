"use server";

/**
 * services/browser/screenshot.ts
 *
 * Page Screenshot Service
 * Captures visual screenshots of web pages via Playwright,
 * returning base64 data strings and auto-saving task artifacts.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { withBrowserPage } from "./browser-service";

export interface ScreenshotResult {
  url: string;
  title: string;
  base64Data: string;
  artifactId?: string;
  success: boolean;
  error?: string;
}

export async function capturePageScreenshot(
  targetUrl: string,
  taskId?: string
): Promise<ScreenshotResult> {
  const formattedUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;

  const res = await withBrowserPage(async (page) => {
    await page.goto(formattedUrl, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {
      return page.goto(formattedUrl, { waitUntil: "domcontentloaded", timeout: 10000 });
    });

    const title = await page.title();
    const buffer = await page.screenshot({ type: "jpeg", quality: 80 });
    const base64Data = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    return { title, base64Data };
  });

  if (!res.success || !res.data) {
    return {
      url: formattedUrl,
      title: formattedUrl,
      base64Data: "",
      success: false,
      error: res.error || "Failed to capture screenshot",
    };
  }

  let artifactId: string | undefined;

  if (taskId) {
    try {
      const { supabase } = await getServerContext();
      const { data: artifact } = await supabase
        .from("task_artifacts")
        .insert({
          task_id: taskId,
          title: `Web Screenshot - ${res.data.title || formattedUrl}`,
          artifact_type: "image",
          content_or_url: res.data.base64Data,
          metadata: {
            url: formattedUrl,
            capturedAt: new Date().toISOString(),
          },
        })
        .select("id")
        .single();

      if (artifact) artifactId = artifact.id;
    } catch (artErr) {
      console.error("[SCREENSHOT ARTIFACT ERROR]:", artErr);
    }
  }

  return {
    url: formattedUrl,
    title: res.data.title,
    base64Data: res.data.base64Data,
    artifactId,
    success: true,
  };
}
