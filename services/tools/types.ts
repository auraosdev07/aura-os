/**
 * services/tools/types.ts
 *
 * Single source of truth for Aura OS Tool Framework v1 types.
 */

export type ToolCategory =
  | "System"
  | "Database"
  | "Search"
  | "Content"
  | "Image"
  | "Commerce"
  | "Communication";

export interface ToolExecutionContext {
  agentId: string;
  taskId?: string;
}

export interface ToolResult {
  success: boolean;
  output: Record<string, unknown> | string;
  error?: string;
  executionTimeMs: number;
}

export interface ToolUsageStats {
  toolId: string;
  name: string;
  category: ToolCategory;
  usageCount: number;
  assignedAgentCount: number;
}
