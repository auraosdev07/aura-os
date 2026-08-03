/**
 * lib/ai/tools/types.ts
 *
 * Core Tool Contracts for Aura OS Agent Tool Framework.
 */

export type ToolPermissionLevel = "READ_ONLY" | "WRITE" | "ADMIN";

export interface ToolParameterSchema {
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
  enum?: string[];
  required?: boolean;
  properties?: Record<string, ToolParameterSchema>;
  items?: ToolParameterSchema;
}

export interface ToolDefinition {
  name: string;
  description: string;
  version?: string;
  parameters: Record<string, ToolParameterSchema>;
  requiredPermissions?: ToolPermissionLevel[];
  category?: "knowledge" | "mission" | "employee" | "system";
  isExperimental?: boolean;
}

/** Legacy alias for backwards compatibility */
export type AIToolDefinition = ToolDefinition;

export interface ToolContext {
  ownerId: string;
  userRole?: string;
  traceId?: string;
  missionId?: string;
  employeeId?: string;
  onToolStart?: (event: { callId: string; toolName: string }) => void;
  onToolComplete?: (event: { callId: string; toolName: string; status: "success" | "error"; executionTimeMs: number }) => void;
  onToolError?: (event: { callId: string; toolName: string; error: { code: string; message: string } }) => void;
}

export interface ToolResult<TData = unknown> {
  callId: string;
  toolName: string;
  status: "success" | "error";
  data?: TData;
  error?: {
    code: "UNKNOWN_TOOL" | "INVALID_ARGS" | "TIMEOUT" | "PERMISSION_DENIED" | "EXECUTION_ERROR";
    message: string;
  };
  executionTimeMs: number;
}

export type ToolExecutor<TArgs = Record<string, unknown>, TResult = unknown> = (
  args: TArgs,
  context: ToolContext
) => Promise<TResult>;

export interface ToolCallRequest {
  callId: string;
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface AITool<TArgs = Record<string, unknown>, TResult = unknown> {
  definition: ToolDefinition;
  execute: ToolExecutor<TArgs, TResult>;
}
