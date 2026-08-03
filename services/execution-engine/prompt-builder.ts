/**
 * services/execution-engine/prompt-builder.ts
 *
 * Prompt Builder Module
 * Formats system prompt, user prompt, and metadata from an ExecutionContext object.
 * Injects private and shared memory context into the system prompt.
 */

import type { ExecutionContext, GeneratedPrompt } from "./types";

export function buildPrompt(context: ExecutionContext): GeneratedPrompt {
  const { task, agent, memories } = context;

  const privateMemText =
    memories.privateMemories.length > 0
      ? memories.privateMemories
          .map((m) => `- [PRIVATE] ${m.key}: ${JSON.stringify(m.value)}`)
          .join("\n")
      : "No private memories stored.";

  const sharedMemText =
    memories.sharedMemories.length > 0
      ? memories.sharedMemories
          .map((m) => `- [SHARED] ${m.key}: ${JSON.stringify(m.value)}`)
          .join("\n")
      : "No shared memories stored.";

  const systemPrompt = `You are ${agent.name}, an autonomous AI agent operating within Aura OS.
Role: ${agent.role}
Description: ${agent.description || "Operational execution agent."}
Memory Scope Setting: ${agent.memoryScope}

Available Pluggable Tools (${agent.enabledTools.length}):
${agent.enabledTools.length > 0 ? agent.enabledTools.map((t) => `- ${t}`).join("\n") : "None attached."}

Connected Integrations (${agent.connectedIntegrations.length}):
${agent.connectedIntegrations.length > 0 ? agent.connectedIntegrations.map((i) => `- ${i}`).join("\n") : "None attached."}

Agent Persistent Memory Context:
-- PRIVATE MEMORY --
${privateMemText}

-- SHARED MEMORY --
${sharedMemText}

Instructions:
Execute the assigned operational task according to your role boundaries, memory context, and tools. Produce clean, structured outputs.`;

  const userPrompt = `TASK ASSIGNMENT:
Title: ${task.title}
Priority: ${task.priority}
Description: ${task.description || "No further details provided."}

Task Metadata:
${JSON.stringify(task.metadata, null, 2)}`;

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      generatedAt: new Date().toISOString(),
      taskId: task.id,
      agentId: agent.id,
      toolCount: agent.enabledTools.length,
      integrationCount: agent.connectedIntegrations.length,
      privateMemoryCount: memories.privateMemories.length,
      sharedMemoryCount: memories.sharedMemories.length,
    },
  };
}
