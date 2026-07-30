/**
 * lib/ai/tools/types.ts
 *
 * Types for AI tools and function calling schemas.
 */

export interface ToolParameterSchema {
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
  enum?: string[];
  required?: boolean;
  properties?: Record<string, ToolParameterSchema>;
}

export interface AIToolDefinition {
  name: string;
  description: string;
  parameters?: Record<string, ToolParameterSchema>;
}

export type AIToolExecutor<TArgs = Record<string, unknown>, TResult = unknown> = (
  args: TArgs
) => Promise<TResult>;

export interface AITool<TArgs = Record<string, unknown>, TResult = unknown> {
  definition: AIToolDefinition;
  execute: AIToolExecutor<TArgs, TResult>;
}
