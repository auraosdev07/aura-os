/**
 * services/tools/implementations/read-website-tool.ts
 *
 * Read Website Tool (read_website)
 * Category: Content
 */

import { BaseTool } from "../base-tool";
import type { ToolCategory, ToolExecutionContext, ToolResult } from "../types";

export class ReadWebsiteTool extends BaseTool {
  id = "read_website";
  name = "Read Website";
  description = "Navigates to a target URL, strips scripts/styles, and returns clean readable markdown text content and links.";
  category: ToolCategory = "Content";
  permissions = ["web:read", "network:read"];

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
      const { readWebsiteContent } = await import("@/services/browser/page-reader");
      const readRes = await readWebsiteContent(url);

      if (context?.agentId && readRes.success) {
        try {
          const { createMemory } = await import("@/services/memory");
          await createMemory(
            context.agentId,
            `visited_url_${url.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20)}`,
            {
              url: readRes.url,
              title: readRes.title,
              visitedAt: new Date().toISOString(),
            },
            "private"
          );
        } catch {
          // Ignore memory errors
        }
      }

      return {
        success: readRes.success,
        output: JSON.stringify(readRes),
        error: readRes.error,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Read website execution failed";
      return {
        success: false,
        output: "Read website failed",
        error: errorMsg,
      };
    }
  }
}
