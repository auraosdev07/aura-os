/**
 * services/execution-engine/planner.ts
 *
 * Agent Planner Module (Knowledge-Aware - Phase 3.2 Production)
 * Compiles structured execution plans and stage maps from Agent specs, Task details,
 * attached tools, retrieved Knowledge Engine documents, and loaded memories.
 */

import type { ExecutionContext, GeneratedPrompt } from "./types";
import { buildPrompt } from "./prompt-builder";

export type ExecutionStage =
  | "Planning"
  | "Knowledge Retrieval"
  | "Tool Calling"
  | "Reasoning"
  | "Writing"
  | "Memory"
  | "Completed";

export interface PlanStep {
  stepNumber: number;
  stage: ExecutionStage;
  description: string;
}

export interface ExecutionPlan {
  prompt: GeneratedPrompt;
  stages: ExecutionStage[];
  planSteps: PlanStep[];
  attachedToolIds: string[];
  hasSufficientKnowledge: boolean;
}

export function generatePlan(context: ExecutionContext): ExecutionPlan {
  const prompt = buildPrompt(context);
  const hasSufficientKnowledge = Boolean(context.knowledgeContext?.hasSufficientKnowledge);
  const docCount = context.knowledgeContext?.documents.length || 0;

  const stages: ExecutionStage[] = [
    "Planning",
    "Knowledge Retrieval",
    "Tool Calling",
    "Reasoning",
    "Writing",
    "Memory",
    "Completed",
  ];

  const planSteps: PlanStep[] = [
    {
      stepNumber: 1,
      stage: "Planning",
      description: `Compile prompt context for agent '${context.agent.name}' (${context.agent.role}).`,
    },
    {
      stepNumber: 2,
      stage: "Knowledge Retrieval",
      description: hasSufficientKnowledge
        ? `Retrieved ${docCount} high-relevance documents (relevance >= 65%). Sufficient knowledge available.`
        : `Retrieved ${docCount} documents. Knowledge relevance < 65% (Miss). Tool orchestration required.`,
    },
    {
      stepNumber: 3,
      stage: "Tool Calling",
      description: hasSufficientKnowledge
        ? `Sufficient retrieved knowledge found. Skipping unnecessary web search tools.`
        : `Evaluate attached tools (${context.agent.enabledTools.join(", ") || "None"}) and execute Web Search or tools.`,
    },
    {
      stepNumber: 4,
      stage: "Reasoning",
      description: "Synthesize retrieved knowledge, tool outputs, and reason over operational findings.",
    },
    {
      stepNumber: 5,
      stage: "Writing",
      description: "Format and write final task response & deliverables.",
    },
    {
      stepNumber: 6,
      stage: "Memory",
      description: "Extract useful insights and write to persistent agent_memory.",
    },
    {
      stepNumber: 7,
      stage: "Completed",
      description: "Auto-save deliverable into Knowledge Engine and update task status to COMPLETED.",
    },
  ];

  return {
    prompt,
    stages,
    planSteps,
    attachedToolIds: context.agent.enabledTools,
    hasSufficientKnowledge,
  };
}
