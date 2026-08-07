/**
 * services/tools/tool-registry.ts
 *
 * Tool Registry Module
 * Central registry of all pluggable tools in Aura OS.
 * Enables dynamic registration and lookup by tool ID.
 */

import { BaseTool } from "./base-tool";
import type { ToolCategory } from "./types";
import { SearchDatabaseTool } from "./implementations/search-database-tool";
import { SearchMemoryTool } from "./implementations/search-memory-tool";
import { CreateArtifactTool } from "./implementations/create-artifact-tool";
import { ReadProductsTool } from "./implementations/read-products-tool";
import { ListCategoriesTool } from "./implementations/list-categories-tool";
import { SearchTasksTool } from "./implementations/search-tasks-tool";
import { WebSearchTool } from "./implementations/web-search-tool";
import { ReadWebsiteTool } from "./implementations/read-website-tool";
import { CapturePageTool } from "./implementations/capture-page-tool";
import { SummarizePageTool } from "./implementations/summarize-page-tool";
import { RequestAgentInfoTool } from "../acp/request-info-tool";

const registry = new Map<string, BaseTool>();

function registerDefaultTools() {
  const defaults: BaseTool[] = [
    new SearchDatabaseTool(),
    new SearchMemoryTool(),
    new CreateArtifactTool(),
    new ReadProductsTool(),
    new ListCategoriesTool(),
    new SearchTasksTool(),
    new WebSearchTool(),
    new ReadWebsiteTool(),
    new CapturePageTool(),
    new SummarizePageTool(),
    new RequestAgentInfoTool(),
  ];

  for (const tool of defaults) {
    registry.set(tool.id.toLowerCase(), tool);
  }
}

// Auto-register built-in tools
registerDefaultTools();

export function registerTool(tool: BaseTool): void {
  registry.set(tool.id.toLowerCase(), tool);
}

export function getTool(toolId: string): BaseTool | undefined {
  return registry.get(toolId.toLowerCase());
}

export function listTools(): BaseTool[] {
  return Array.from(registry.values());
}

export function getToolsByCategory(category: ToolCategory): BaseTool[] {
  return listTools().filter((t) => t.category === category);
}
