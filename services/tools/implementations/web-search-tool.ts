/**
 * services/tools/implementations/web-search-tool.ts
 *
 * Web Search Tool (web_search)
 * Category: Search
 */

import { BaseTool } from "../base-tool";
import type { ToolCategory, ToolExecutionContext, ToolResult } from "../types";

export class WebSearchTool extends BaseTool {
  id = "web_search";
  name = "Web Search";
  description = "Executes live web search queries against search engines and returns top matching URLs with title and snippet previews.";
  category: ToolCategory = "Search";
  permissions = ["web:search", "network:read"];

  async execute(
    input: Record<string, unknown>,
    context?: ToolExecutionContext
  ): Promise<Omit<ToolResult, "executionTimeMs">> {
    const query = String(input.query || "").trim();
    if (!query) {
      return {
        success: false,
        output: "Search query string is required.",
        error: "Missing required parameter 'query'.",
      };
    }

    try {
      const { performWebSearch } = await import("@/services/browser/search");
      const searchRes = await performWebSearch(query);

      if (context?.agentId && searchRes.results.length > 0) {
        try {
          const { createMemory } = await import("@/services/memory");
          await createMemory(
            context.agentId,
            `web_search_${query.substring(0, 15).replace(/\s+/g, "_")}`,
            {
              query,
              topResults: searchRes.results.slice(0, 3),
              searchedAt: new Date().toISOString(),
            },
            "private"
          );
        } catch {
          // Ignore memory errors
        }
      }

      return {
        success: searchRes.success,
        output: JSON.stringify(searchRes),
        error: searchRes.error,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Web search execution failed";
      return {
        success: false,
        output: "Web search failed",
        error: errorMsg,
      };
    }
  }
}
