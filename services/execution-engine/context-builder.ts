/**
 * services/execution-engine/context-builder.ts
 *
 * Execution Context Builder Module (Knowledge-Aware - Phase 3.2)
 * Compiles structured execution context from task details, agent specs,
 * tools, integrations, private & shared memories, dependency task outputs, ACP messages,
 * AND Knowledge Engine Retrieval.
 */

import type { TaskRow } from "@/types/task";
import type { AgentRow } from "@/types/agent";
import { getMemory } from "@/services/memory";
import { getServerContext } from "@/lib/auth/get-server-context";
import { getTaskOutput } from "@/services/task-output";
import { getInbox } from "@/services/acp/messaging-service";
import { searchRelevantKnowledge } from "@/services/knowledge-retrieval";
import type { ExecutionContext } from "./types";

export async function buildExecutionContext(
  task: TaskRow,
  agent: AgentRow
): Promise<ExecutionContext> {
  const { supabase } = await getServerContext();

  // 1. Load memories
  const allMemories = await getMemory(agent.id);
  const privateMemories = allMemories.filter((m) => m.scope === "private");
  const sharedMemories = allMemories.filter((m) => m.scope === "shared");

  // 2. Load dependency task outputs if this task depends on another subtask
  const dependencyOutputs: Array<{ taskId: string; title: string; summary: string; output: string }> = [];
  const dependsOnTaskId = (task.metadata?.dependsOnTaskId || task.metadata?.dependencyTaskId) as string | undefined;

  if (dependsOnTaskId && supabase) {
    const { data: depTask } = await supabase
      .from("tasks")
      .select("id, title")
      .eq("id", dependsOnTaskId)
      .maybeSingle();

    if (depTask) {
      const outputRow = await getTaskOutput(depTask.id);
      if (outputRow) {
        dependencyOutputs.push({
          taskId: depTask.id,
          title: depTask.title,
          summary: outputRow.summary,
          output: outputRow.output,
        });
      }
    }
  }

  // Also fetch parent's other completed subtasks if task is a child subtask
  const parentTaskId = task.metadata?.parentTaskId as string | undefined;
  if (parentTaskId && supabase) {
    const { data: subtaskLinks } = await supabase
      .from("task_subtasks")
      .select("child_task_id")
      .eq("parent_task_id", parentTaskId)
      .neq("child_task_id", task.id);

    if (subtaskLinks && subtaskLinks.length > 0) {
      const siblingIds = subtaskLinks.map((s) => s.child_task_id);
      for (const sibId of siblingIds) {
        const { data: sibTask } = await supabase
          .from("tasks")
          .select("id, title, status")
          .eq("id", sibId)
          .maybeSingle();

        if (sibTask && sibTask.status === "COMPLETED") {
          const sibOutput = await getTaskOutput(sibTask.id);
          if (sibOutput && !dependencyOutputs.some((d) => d.taskId === sibTask.id)) {
            dependencyOutputs.push({
              taskId: sibTask.id,
              title: sibTask.title,
              summary: sibOutput.summary,
              output: sibOutput.output,
            });
          }
        }
      }
    }
  }

  // 3. Fetch ACP Inbox Messages for this Agent
  const acpMessages: Array<{ senderName: string; content: string; type: string }> = [];
  try {
    const inbox = await getInbox(agent.id);
    for (const msg of inbox.slice(0, 5)) {
      acpMessages.push({
        senderName: msg.sender?.name || `Agent #${msg.sender_agent_id.substring(0, 6)}`,
        content: msg.content,
        type: msg.message_type,
      });
    }
  } catch {
    // Ignore if ACP table empty
  }

  // 4. KNOWLEDGE RETRIEVAL STEP (Phase 3.2 Core)
  const taskQuery = `${task.title} ${task.description || ""}`;
  const knowledgeContext = await searchRelevantKnowledge(taskQuery, { minRelevanceScore: 0.35, limit: 5 });

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
    dependencyOutputs,
    acpMessages,
    knowledgeContext,
  };
}
