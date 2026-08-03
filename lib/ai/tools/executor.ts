/**
 * lib/ai/tools/executor.ts
 *
 * Safe Tool Execution Engine with argument validation, 10s timeouts,
 * duplicate call deduplication, permission checks, and structured error reporting.
 */

import { aiToolRegistry } from "./registry";
import { validateToolArguments } from "./validator";
import type { ToolContext, ToolResult } from "./types";

const DEFAULT_TIMEOUT_MS = 10_000;

// Active execution promise cache for duplicate call protection
const activeExecutions = new Map<string, Promise<ToolResult>>();

export interface ExecuteToolOptions {
  timeoutMs?: number;
}

/**
 * Execute an AI Tool safely. Guaranteed never to throw an unhandled error.
 */
export async function executeTool(
  callId: string,
  toolName: string,
  args: Record<string, unknown>,
  context: ToolContext,
  options?: ExecuteToolOptions
): Promise<ToolResult> {
  // Milestone 3: Duplicate Call Protection
  if (callId && activeExecutions.has(callId)) {
    console.log(`[TOOL EXECUTOR DEDUP] Reusing active promise for callId: ${callId}`);
    return activeExecutions.get(callId)!;
  }

  const executionPromise = (async (): Promise<ToolResult> => {
    const startTime = Date.now();
    const traceId = context.traceId || `trace-${Date.now()}`;
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    context.onToolStart?.({ callId, toolName });

    // 1. Lookup Tool
    const tool = aiToolRegistry.getTool(toolName);
    if (!tool) {
      const result: ToolResult = {
        callId,
        toolName,
        status: "error",
        error: {
          code: "UNKNOWN_TOOL",
          message: `Tool '${toolName}' is not registered or is currently disabled.`,
        },
        executionTimeMs: Date.now() - startTime,
      };
      context.onToolError?.({ callId, toolName, error: result.error! });
      context.onToolComplete?.({ callId, toolName, status: "error", executionTimeMs: result.executionTimeMs });
      logExecution(traceId, result);
      return result;
    }

    // 2. Permission Check
    if (tool.definition.requiredPermissions && tool.definition.requiredPermissions.length > 0) {
      if (!context.ownerId) {
        const result: ToolResult = {
          callId,
          toolName,
          status: "error",
          error: {
            code: "PERMISSION_DENIED",
            message: `Execution denied: Permission context (ownerId) is missing for tool '${toolName}'.`,
          },
          executionTimeMs: Date.now() - startTime,
        };
        context.onToolError?.({ callId, toolName, error: result.error! });
        context.onToolComplete?.({ callId, toolName, status: "error", executionTimeMs: result.executionTimeMs });
        logExecution(traceId, result);
        return result;
      }
    }

    // 3. Argument Validation
    const validation = validateToolArguments(tool.definition, args);
    if (!validation.valid) {
      const errMsgs = validation.errors.map((e) => `${e.field}: ${e.message}`).join("; ");
      const result: ToolResult = {
        callId,
        toolName,
        status: "error",
        error: {
          code: "INVALID_ARGS",
          message: `Invalid arguments for tool '${toolName}': ${errMsgs}`,
        },
        executionTimeMs: Date.now() - startTime,
      };
      context.onToolError?.({ callId, toolName, error: result.error! });
      context.onToolComplete?.({ callId, toolName, status: "error", executionTimeMs: result.executionTimeMs });
      logExecution(traceId, result);
      return result;
    }

    // 4. Execution with Timeout Wrapper
    try {
      const data = await executeWithTimeout(
        () => tool.execute(args, context),
        timeoutMs
      );

      const result: ToolResult = {
        callId,
        toolName,
        status: "success",
        data,
        executionTimeMs: Date.now() - startTime,
      };
      context.onToolComplete?.({ callId, toolName, status: "success", executionTimeMs: result.executionTimeMs });
      logExecution(traceId, result);
      return result;
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== "production") {
        console.error(`[TOOL EXECUTION ERROR] ${toolName}:`, err);
      }

      const elapsed = Date.now() - startTime;
      const isTimeout = err instanceof Error && err.name === "TimeoutError";

      const result: ToolResult = {
        callId,
        toolName,
        status: "error",
        error: {
          code: isTimeout ? "TIMEOUT" : "EXECUTION_ERROR",
          message: err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
        },
        executionTimeMs: elapsed,
      };
      context.onToolError?.({ callId, toolName, error: result.error! });
      context.onToolComplete?.({ callId, toolName, status: "error", executionTimeMs: elapsed });
      logExecution(traceId, result);
      return result;
    }
  })();

  // Cache active execution promise for dedup
  if (callId) {
    activeExecutions.set(callId, executionPromise);
    executionPromise.finally(() => {
      activeExecutions.delete(callId);
    });
  }

  return executionPromise;
}

/**
 * Milestone 2: Execute function with custom timeout wrapper.
 */
async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timerId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => {
      const err = new Error(`Tool execution timed out after ${timeoutMs}ms.`);
      err.name = "TimeoutError";
      reject(err);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    return result;
  } finally {
    if (timerId) clearTimeout(timerId);
  }
}

/**
 * Milestone 4: Execution Logging
 */
function logExecution(traceId: string, result: ToolResult): void {
  if (process.env.NODE_ENV === "development" || process.env.DEBUG) {
    console.log("[TOOL EXECUTION LOG]", {
      traceId,
      callId: result.callId,
      toolName: result.toolName,
      status: result.status,
      executionTimeMs: result.executionTimeMs,
      errorCode: result.error?.code,
      errorMessage: result.error?.message,
    });
  }
}
