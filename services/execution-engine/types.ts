/**
 * services/execution-engine/types.ts
 *
 * Single source of truth for Aura OS Execution Engine types.
 * Supports Knowledge-Aware execution context.
 */

import type { AgentMemoryRow } from "@/types/agent";

export interface KnowledgeContextDoc {
  id: string;
  title: string;
  snippet: string;
  cleanContent: string;
  relevanceScore: number;
  collectionName: string;
}

export interface ExecutionKnowledgeContext {
  documents: KnowledgeContextDoc[];
  highestRelevanceScore: number;
  hasSufficientKnowledge: boolean;
  retrievalTimeMs: number;
  totalMatches: number;
}

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
  dependencyOutputs?: Array<{
    taskId: string;
    title: string;
    summary: string;
    output: string;
  }>;
  acpMessages?: Array<{
    senderName: string;
    content: string;
    type: string;
  }>;
  knowledgeContext?: ExecutionKnowledgeContext;
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
    knowledgeDocumentCount: number;
    highestKnowledgeRelevance: number;
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
