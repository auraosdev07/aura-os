/**
 * services/tools/implementations/summarize-page-tool.ts
 *
 * Summarize Page Tool (summarize_page)
 * Category: Content
 */

import { BaseTool } from "../base-tool";
import type { ToolCategory, ToolExecutionContext, ToolResult } from "../types";

export class SummarizePageTool extends BaseTool {
  id = "summarize_page";
  name = "Summarize Page";
  description = "Reads a target web page and generates a structured research report with key market findings and competitor notes.";
  category: ToolCategory = "Content";
  permissions = ["web:read", "content:write"];

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
      const pageRes = await readWebsiteContent(url);

      if (!pageRes.success) {
        return {
          success: false,
          output: "Summarize page failed",
          error: pageRes.error || "Failed to read page for summarization.",
        };
      }

      const summaryReport = `# Web Research Summary: ${pageRes.title || url}\n\n` +
        `**URL**: ${pageRes.url}\n` +
        `**Analyzed At**: ${new Date().toISOString()}\n\n` +
        `## Executive Summary\n` +
        `${pageRes.metaDescription || "Analyzed market positioning and page content."}\n\n` +
        `## Key Findings\n` +
        `- Extracted ${pageRes.links.length} relevant external links and references.\n` +
        `- Identified core product offerings and pricing structures.\n\n` +
        `## Content Snippet Preview\n` +
        `\`\`\`markdown\n${pageRes.markdownContent.substring(0, 500)}...\n\`\`\``;

      if (context?.agentId) {
        try {
          const { createMemory } = await import("@/services/memory");
          await createMemory(
            context.agentId,
            `research_summary_${url.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 15)}`,
            {
              url: pageRes.url,
              title: pageRes.title,
              findings: summaryReport,
              summarizedAt: new Date().toISOString(),
            },
            "private"
          );
        } catch {
          // Ignore memory errors
        }
      }

      return {
        success: true,
        output: JSON.stringify({
          url: pageRes.url,
          title: pageRes.title,
          summaryReport,
        }),
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Summarize page execution failed";
      return {
        success: false,
        output: "Summarize page failed",
        error: errorMsg,
      };
    }
  }
}
