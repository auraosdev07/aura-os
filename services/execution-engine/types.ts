/**
 * services/execution-engine/types.ts
 *
 * Single source of truth for Aura OS Execution Engine v1 types.
 */

import type { AgentMemoryRow } from "@/types/agent";

export interface ExecutionContext {
  task: {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    metadata: Record<string, unknown>;
  };
  agent: {
    id: string;
    name: string;
    role: string;
    description: string | null;
    enabledTools: string[];
    connectedIntegrations: string[];
    memoryScope: string;
  };
  memories: {
    privateMemories: AgentMemoryRow[];
    sharedMemories: AgentMemoryRow[];
  };
}

export interface GeneratedPrompt {
  systemPrompt: string;
  userPrompt: string;
  metadata: {
    generatedAt: string;
    taskId: string;
    agentId: string;
    toolCount: number;
    integrationCount: number;
    privateMemoryCount: number;
    sharedMemoryCount: number;
  };
}

export interface ExecutionEngineResult {
  processedCount: number;
  results: {
    taskId: string;
    taskTitle: string;
    agentId: string;
    agentName: string;
    runId: string;
    status: string;
  }[];
}
