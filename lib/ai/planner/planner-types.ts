/**
 * lib/ai/planner/planner-types.ts
 *
 * Type contracts for the Aura OS Planning Agent.
 */

export interface PlanStep {
  step: number;
  action: string;
  tool: string;
  arguments: Record<string, unknown>;
  allowParallel?: boolean;
}

export type MemoryDecision =
  | "use_memory"
  | "ignore_memory"
  | "request_fresh_information";

export interface StructuredPlan {
  requiresTools: boolean;
  goal: string;
  reasoning: string;
  memoryDecision?: MemoryDecision;
  selectedMemories?: string[];
  steps: PlanStep[];
}

export interface GeneratePlanOptions {
  userQuery: string;
  availableTools: Array<{ name: string; description: string; parameters: unknown }>;
  memories?: Array<{ id: string; type: string; content: string; importance: number }>;
  provider?: "openai" | "gemini";
  model?: string;
}
