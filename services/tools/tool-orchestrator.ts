/**
 * services/tools/tool-orchestrator.ts
 *
 * Aura OS Tool Orchestrator
 * Sits between the Execution Engine and all registered tools.
 * Handles single & parallel tool execution, automatic retries with exponential backoff,
 * 15s timeout protection, timeline event logging, and database persistence into `tool_executions`.
 */

import { getTool } from "./tool-registry";
import type { ToolResult, ToolExecutionContext } from "./types";

async function getLogger() {
  if (typeof window !== "undefined") return null;
  try {
    return await import("@/lib/db/tool-executions-logger");
  } catch {
    return null;
  }
}

export interface ToolCallRequest {
  toolId: string;
  input: Record<string, unknown>;
}

export interface ToolOrchestrationOptions {
  maxRetries?: number;
  timeoutMs?: number;
  parallel?: boolean;
}

export interface ToolExecutionRecord {
  id: string;
  task_id: string | null;
  agent_id: string | null;
  tool_id: string;
  tool_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status: "SUCCESS" | "FAILED" | "RETRYING" | "TIMED_OUT";
  attempt_count: number;
  execution_time_ms: number;
  error_message: string | null;
  created_at: string;
}

// Live In-Memory Telemetry Store for Runtime Control
let totalToolExecutions = 0;
let activeToolCalls = 0;
let totalRetries = 0;
let totalTimeouts = 0;
const liveToolLogs: Array<{ id: string; toolId: string; status: string; executionTimeMs: number; time: string }> = [];

export class ToolOrchestrator {
  /**
   * Executes a single tool call with timeout protection and automatic retry logic.
   */
  static async executeTool(
    request: ToolCallRequest,
    context: ToolExecutionContext,
    options?: ToolOrchestrationOptions
  ): Promise<ToolResult> {
    const maxRetries = options?.maxRetries ?? 2;
    const timeoutMs = options?.timeoutMs ?? 15000;

    const tool = getTool(request.toolId);
    const toolName = tool?.name || request.toolId;

    activeToolCalls++;
    const overallStartTime = Date.now();
    let attempt = 0;
    let lastError = "";
    let finalResult: ToolResult | null = null;

    const logger = await getLogger();

    // Log TOOL_EXECUTION_STARTED event
    if (context.taskId && logger) {
      await logger.logToolEventDb(
        context.taskId,
        context.agentId,
        "TOOL_EXECUTION_STARTED",
        `Tool Orchestrator started '${toolName}' (${request.toolId}).`,
        { toolId: request.toolId, input: request.input }
      );
    }

    while (attempt <= maxRetries) {
      attempt++;
      const attemptStartTime = Date.now();

      try {
        if (!tool) {
          throw new Error(`Tool '${request.toolId}' is not registered in ToolRegistry.`);
        }

        // Timeout Protection via Promise.race
        const executionPromise = tool.execute(request.input, context);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Tool execution timed out after ${timeoutMs}ms.`)), timeoutMs)
        );

        const rawResult = await Promise.race([executionPromise, timeoutPromise]);
        const executionTimeMs = Date.now() - attemptStartTime;

        if (rawResult.success) {
          finalResult = { ...rawResult, executionTimeMs };
          break; // Successful execution
        }

        lastError = rawResult.error || "Tool execution failed.";
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : "Tool execution runtime error";
        if (lastError.includes("timed out")) {
          totalTimeouts++;
        }
      }

      // Retry logic
      if (attempt <= maxRetries) {
        totalRetries++;

        if (context.taskId && logger) {
          await logger.logToolEventDb(
            context.taskId,
            context.agentId,
            "TOOL_RETRY",
            `Retrying tool '${toolName}' (Attempt ${attempt + 1}/${maxRetries + 1}). Error: ${lastError}`,
            { toolId: request.toolId, attempt: attempt + 1, error: lastError }
          );
        }

        // Brief delay before retry
        await new Promise((res) => setTimeout(res, 500 * attempt));
      }
    }

    const totalExecutionTimeMs = Date.now() - overallStartTime;
    activeToolCalls = Math.max(0, activeToolCalls - 1);
    totalToolExecutions++;

    const status: "SUCCESS" | "FAILED" | "TIMED_OUT" = finalResult?.success
      ? "SUCCESS"
      : lastError.includes("timed out")
      ? "TIMED_OUT"
      : "FAILED";

    const result: ToolResult = finalResult || {
      success: false,
      output: {},
      error: lastError || `Tool execution failed after ${attempt} attempts.`,
      executionTimeMs: totalExecutionTimeMs,
    };

    // Store in `tool_executions` DB table
    if (logger) {
      await logger.logToolExecutionDb({
        task_id: context.taskId || null,
        agent_id: context.agentId,
        tool_id: request.toolId,
        tool_name: toolName,
        input: request.input,
        output: typeof result.output === "object" && result.output !== null ? (result.output as Record<string, unknown>) : { value: result.output || "" },
        status,
        attempt_count: attempt,
        execution_time_ms: totalExecutionTimeMs,
        error_message: result.error || null,
      });
    }

    // Update Live Memory Log
    liveToolLogs.unshift({
      id: Math.random().toString(36).substring(2, 9),
      toolId: request.toolId,
      status,
      executionTimeMs: totalExecutionTimeMs,
      time: new Date().toLocaleTimeString(),
    });
    if (liveToolLogs.length > 20) liveToolLogs.pop();

    return result;
  }

  /**
   * Executes multiple tool calls in parallel where possible.
   */
  static async executeToolsParallel(
    requests: ToolCallRequest[],
    context: ToolExecutionContext,
    options?: ToolOrchestrationOptions
  ): Promise<ToolResult[]> {
    return Promise.all(
      requests.map((req) => this.executeTool(req, context, { ...options, parallel: true }))
    );
  }

  /**
   * Fetches tool execution history for a given task ID (Task Drawer UI).
   */
  static async getTaskToolExecutions(taskId: string): Promise<ToolExecutionRecord[]> {
    try {
      const logger = await getLogger();
      if (!logger) return [];
      const data = await logger.fetchTaskToolExecutionsDb(taskId);
      return data as ToolExecutionRecord[];
    } catch {
      return [];
    }
  }

  /**
   * Live Telemetry for Runtime Control Center
   */
  static getTelemetry() {
    return {
      totalToolExecutions,
      activeToolCalls,
      totalRetries,
      totalTimeouts,
      liveToolLogs,
    };
  }
}
