"use server";

/**
 * services/multi-agent/delegation.ts
 *
 * Multi-Agent Subtask Delegation Service
 * Automatically assigns unassigned child tasks to the best matching IDLE agent
 * based on role tags (SEO, Developer, Designer, Marketing).
 * Reuses existing Manager Runtime assignment rules without duplication.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { assignTask } from "@/services/task";
import type { TaskRow } from "@/types/task";
import type { AgentRow } from "@/types/agent";

/**
 * Matches target role text to agent role/name keywords.
 */
export async function matchAgentByRole(targetRole: string, agents: AgentRow[]): Promise<AgentRow | null> {
  const roleLower = targetRole.toLowerCase();

  // 1. Direct match on agent role
  const directMatch = agents.find(
    (a) => a.status === "IDLE" && a.role.toLowerCase().includes(roleLower)
  );
  if (directMatch) return directMatch;

  // 2. Keyword fallback matching
  if (roleLower.includes("seo")) {
    return agents.find((a) => a.status === "IDLE" && (a.role.toLowerCase().includes("seo") || a.name.toLowerCase().includes("seo"))) || null;
  }
  if (roleLower.includes("marketing") || roleLower.includes("content")) {
    return agents.find((a) => a.status === "IDLE" && (a.role.toLowerCase().includes("marketing") || a.role.toLowerCase().includes("content"))) || null;
  }
  if (roleLower.includes("design") || roleLower.includes("image")) {
    return agents.find((a) => a.status === "IDLE" && (a.role.toLowerCase().includes("design") || a.name.toLowerCase().includes("designer"))) || null;
  }
  if (roleLower.includes("dev") || roleLower.includes("qa") || roleLower.includes("page")) {
    return agents.find((a) => a.status === "IDLE" && (a.role.toLowerCase().includes("dev") || a.name.toLowerCase().includes("developer"))) || null;
  }

  // 3. Fallback: Any available IDLE agent
  return agents.find((a) => a.status === "IDLE") || null;
}

export async function delegateUnassignedSubtasks(parentTaskId: string): Promise<number> {
  const { supabase } = await getServerContext();

  // 1. Fetch subtasks for this parent task
  const { data: subtaskLinks } = await supabase
    .from("task_subtasks")
    .select("child_task_id, dependency_task_id")
    .eq("parent_task_id", parentTaskId);

  if (!subtaskLinks || subtaskLinks.length === 0) return 0;

  const childIds = subtaskLinks.map((s) => s.child_task_id);

  // Fetch child tasks
  const { data: childTasks } = await supabase
    .from("tasks")
    .select("*")
    .in("id", childIds);

  if (!childTasks || childTasks.length === 0) return 0;

  // Fetch available agents
  const { data: availableAgents } = await supabase
    .from("agents")
    .select("*")
    .eq("status", "IDLE");

  if (!availableAgents || availableAgents.length === 0) return 0;

  let assignedCount = 0;

  for (const child of childTasks as TaskRow[]) {
    // Only assign unassigned tasks in CREATED or WAITING status (if dependency complete)
    if (child.assigned_agent_id) continue;

    // Check if dependency is satisfied
    const link = subtaskLinks.find((l) => l.child_task_id === child.id);
    if (link?.dependency_task_id) {
      const { data: depTask } = await supabase
        .from("tasks")
        .select("status")
        .eq("id", link.dependency_task_id)
        .single();

      if (depTask?.status !== "COMPLETED") {
        // Dependency still pending, skip assignment for now
        continue;
      }
    }

    // Target role hint from metadata
    const meta = (child.metadata || {}) as Record<string, unknown>;
    const targetRole = String(meta.targetRole || "General");

    const matchedAgent = await matchAgentByRole(targetRole, availableAgents as AgentRow[]);

    if (matchedAgent) {
      // Assign task using central assignTask service
      await assignTask(child.id, matchedAgent.id);
      assignedCount++;

      // Log SUBTASK_ASSIGNED event
      await supabase.from("task_events").insert({
        task_id: parentTaskId,
        agent_id: matchedAgent.id,
        event_type: "SUBTASK_ASSIGNED",
        message: `Child subtask '${child.title}' assigned to agent '${matchedAgent.name}'.`,
        details: { childTaskId: child.id, agentId: matchedAgent.id, agentName: matchedAgent.name },
      });
    }
  }

  return assignedCount;
}
