/**
 * services/tools/implementations/capture-page-tool.ts
 *
 * Capture Page Tool (capture_page)
 * Category: Image
 */

import { BaseTool } from "../base-tool";
import type { ToolCategory, ToolExecutionContext, ToolResult } from "../types";

export class CapturePageTool extends BaseTool {
  id = "capture_page";
  name = "Capture Page Screenshot";
  description = "Captures a visual screenshot of a target web page and saves an image artifact into the task artifacts storage.";
  category: ToolCategory = "Image";
  permissions = ["web:read", "artifacts:write"];

  async execute(
    input: Record<string, unknown>,
    context?: ToolExecutionContext
  ): Promise<Omit<ToolResult, "executionTimeMs">> {
    const url = String(input.url || "").trim();
    if (!url) {
      return {
        success: false,
        output: "Target URL string is required.",
        error: "Missing required parameter 'url'.",
      };
    }

    try {
      const { capturePageScreenshot } = await import("@/services/browser/screenshot");
      const shotRes = await capturePageScreenshot(url, context?.taskId);

      return {
        success: shotRes.success,
        output: JSON.stringify({
          url: shotRes.url,
          title: shotRes.title,
          artifactId: shotRes.artifactId,
          previewAvailable: !!shotRes.base64Data,
        }),
        error: shotRes.error,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Capture page execution failed";
      return {
        success: false,
        output: "Capture page failed",
        error: errorMsg,
      };
    }
  }
}
