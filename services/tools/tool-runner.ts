"use server";

/**
 * services/tools/tool-runner.ts
 *
 * Backwards Compatible Tool Runner Wrapper
 * Delegates tool executions directly to ToolOrchestrator.
 */

import { ToolOrchestrator } from "./tool-orchestrator";
import type { ToolResult } from "./types";

export async function runTool(
  toolId: string,
  input: Record<string, unknown> = {},
  agentId: string,
  taskId?: string
): Promise<ToolResult> {
  return ToolOrchestrator.executeTool(
    { toolId, input },
    { agentId, taskId }
  );
}

