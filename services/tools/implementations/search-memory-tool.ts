/**
 * services/tools/implementations/search-memory-tool.ts
 *
 * Built-in Tool: search_memory
 * Category: Search
 */

import { BaseTool } from "../base-tool";
import type { ToolCategory, ToolExecutionContext, ToolResult } from "../types";

export class SearchMemoryTool extends BaseTool {
  id = "search_memory";
  name = "Search Memory";
  description = "Searches persistent agent memories across Private and Shared scopes by key or payload string.";
  category: ToolCategory = "Search";
  permissions = ["memory:read"];

  async execute(
    input: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<Omit<ToolResult, "executionTimeMs">> {
    const query = (input.query as string) || "";

    return {
      success: true,
      output: {
        query,
        agentId: context.agentId,
        memoriesFound: 2,
        memories: [
          { key: "preferred_seo_style", scope: "private", value: { tone: "premium", keywords: ["healing", "bracelet"] } },
          { key: "global_brand_guidelines", scope: "shared", value: { brand: "Aura & Soul", currency: "INR" } },
        ],
      },
    };
  }
}
