/**
 * services/tools/implementations/search-tasks-tool.ts
 *
 * Built-in Tool: search_tasks
 * Category: System
 */

import { BaseTool } from "../base-tool";
import type { ToolCategory, ToolResult } from "../types";

export class SearchTasksTool extends BaseTool {
  id = "search_tasks";
  name = "Search Orchestrated Tasks";
  description = "Searches tasks in the Task Orchestrator by status, priority, or search term.";
  category: ToolCategory = "System";
  permissions = ["tasks:read"];

  async execute(input: Record<string, unknown>): Promise<Omit<ToolResult, "executionTimeMs">> {
    const search = (input.search as string) || (input.query as string) || "";
    const status = (input.status as string) || "ALL";

    return {
      success: true,
      output: {
        search,
        status,
        tasksFound: 2,
        tasks: [
          { id: "task_101", title: "Audit Aura & Soul Product Catalog SEO", status: "RUNNING", priority: "HIGH", assignedAgent: "SEO Agent" },
          { id: "task_102", title: "Generate Social Media Campaign Assets", status: "ASSIGNED", priority: "NORMAL", assignedAgent: "Marketing Agent" },
        ],
      },
    };
  }
}
