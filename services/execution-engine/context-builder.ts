/**
 * services/execution-engine/context-builder.ts
 *
 * Execution Context Builder Module
 * Compiles structured execution context from task details, agent specs,
 * tools, integrations, AND loads private & shared agent memories from memory service.
 */

import type { TaskRow } from "@/types/task";
import type { AgentRow } from "@/types/agent";
import { getMemory } from "@/services/memory";
import type { ExecutionContext } from "./types";

export async function buildExecutionContext(
  task: TaskRow,
  agent: AgentRow
): Promise<ExecutionContext> {
  const allMemories = await getMemory(agent.id);

  const privateMemories = allMemories.filter((m) => m.scope === "private");
  const sharedMemories = allMemories.filter((m) => m.scope === "shared");

  return {
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      metadata: task.metadata || {},
    },
    agent: {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      description: agent.description,
      enabledTools: agent.enabled_tools || [],
      connectedIntegrations: agent.connected_integrations || [],
      memoryScope: agent.memory_scope || "private",
    },
    memories: {
      privateMemories,
      sharedMemories,
    },
  };
}
