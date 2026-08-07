"use server";

/**
 * services/mace/mace-orchestrator.ts
 *
 * Multi-Agent Collaboration Engine (MACE) v1 Orchestrator
 * Scans subtasks, enforces DAG dependency ordering, passes completed prerequisite outputs into dependent tasks,
 * assigns ready child subtasks to matching IDLE agents in parallel, and automatically merges completed parent workflows.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { assignTask } from "@/services/task";
import type { TaskRow } from "@/types/task";
import type { AgentRow } from "@/types/agent";

export interface MaceOrchestratorResult {
  processedSubtasks: number;
  assignedMatches: Array<{ childTaskId: string; agentId: string; agentName: string }>;
  unlockedSubtasks: number;
}

export async function runMaceOrchestratorTick(): Promise<MaceOrchestratorResult> {
  const { supabase } = await getServerContext();
  if (!supabase || typeof supabase.from !== "function") {
    return { processedSubtasks: 0, assignedMatches: [], unlockedSubtasks: 0 };
  }

  // 1. Fetch subtask relationships
  const { data: subtaskLinks } = await supabase
    .from("task_subtasks")
    .select("parent_task_id, child_task_id, dependency_task_id, execution_order");

  if (!subtaskLinks || subtaskLinks.length === 0) {
    return { processedSubtasks: 0, assignedMatches: [], unlockedSubtasks: 0 };
  }

  const childIds = subtaskLinks.map((s) => s.child_task_id);

  // 2. Fetch all child subtasks
  const { data: rawChildTasks } = await supabase
    .from("tasks")
    .select("*")
    .in("id", childIds);

  if (!rawChildTasks || rawChildTasks.length === 0) {
    return { processedSubtasks: 0, assignedMatches: [], unlockedSubtasks: 0 };
  }

  const childTasks = rawChildTasks as TaskRow[];
  const createdCount = childTasks.filter((t) => t.status === "CREATED").length;
  const assignedCount = childTasks.filter((t) => ["ASSIGNED", "RUNNING"].includes(t.status)).length;
  const waitingCount = childTasks.filter((t) => t.status === "WAITING").length;

  console.log(`[MACE][Manager]\nFound ${childTasks.length} child tasks\nCreated: ${createdCount}\nAssigned: ${assignedCount}\nWaiting: ${waitingCount}`);

  // 3. Unlock WAITING tasks whose prerequisites have reached COMPLETED
  let unlockedCount = 0;
  for (const child of childTasks) {
    if (child.status !== "WAITING") continue;

    const link = subtaskLinks.find((l) => l.child_task_id === child.id);
    if (!link?.dependency_task_id) {
      // No dependency, unlock to CREATED
      await supabase.from("tasks").update({ status: "CREATED" }).eq("id", child.id);
      unlockedCount++;
      continue;
    }

    // Check prerequisite status
    const prereq = childTasks.find((t) => t.id === link.dependency_task_id);
    if (prereq && prereq.status === "COMPLETED") {
      // Prerequisite completed: Extract output text from prerequisite artifacts/events
      const { data: prereqArtifacts } = await supabase
        .from("task_artifacts")
        .select("content_or_url")
        .eq("task_id", prereq.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const prereqOutput = prereqArtifacts?.[0]?.content_or_url || "Prerequisite task completed successfully.";

      // Update child task metadata to include prerequisite output context
      const meta = (child.metadata || {}) as Record<string, unknown>;
      const updatedMeta = {
        ...meta,
        dependencyContext: {
          prerequisiteTaskId: prereq.id,
          prerequisiteTitle: prereq.title,
          prerequisiteOutput: prereqOutput,
        },
      };

      await supabase
        .from("tasks")
        .update({
          status: "CREATED",
          metadata: updatedMeta,
          updated_at: new Date().toISOString(),
        })
        .eq("id", child.id);

      unlockedCount++;
    }
  }

  // 4. Fetch available IDLE agents for parallel assignment
  const { data: rawAgents } = await supabase
    .from("agents")
    .select("*")
    .eq("status", "IDLE");

  const availableAgents = rawAgents ? [...(rawAgents as AgentRow[])] : [];
  const assignedMatches: MaceOrchestratorResult["assignedMatches"] = [];

  // Filter subtasks ready for assignment (status CREATED, no assigned_agent_id)
  const readySubtasks = childTasks.filter(
    (t) => (t.status === "CREATED" || t.status === "QUEUED") && !t.assigned_agent_id
  );

  for (const child of readySubtasks) {
    if (availableAgents.length === 0) break;

    const meta = (child.metadata || {}) as Record<string, unknown>;
    const targetRole = String(meta.targetRole || "").toLowerCase();

    // Match best IDLE agent by role
    let matchedIndex = availableAgents.findIndex(
      (a) => a.role.toLowerCase().includes(targetRole) || a.name.toLowerCase().includes(targetRole)
    );

    if (matchedIndex === -1) {
      // Fallback: Pick first available IDLE agent
      matchedIndex = 0;
    }

    const agent = availableAgents[matchedIndex];
    availableAgents.splice(matchedIndex, 1); // Remove from available pool to support parallel multi-agent matching

    await assignTask(child.id, agent.id);
    console.log(`Assigned child ${child.id} to agent ${agent.id}`);

    assignedMatches.push({
      childTaskId: child.id,
      agentId: agent.id,
      agentName: agent.name,
    });

    const link = subtaskLinks.find((l) => l.child_task_id === child.id);
    const parentTaskId = link?.parent_task_id || child.id;

    // Log SUBTASK_ASSIGNED event
    await supabase.from("task_events").insert({
      task_id: parentTaskId,
      agent_id: agent.id,
      event_type: "SUBTASK_ASSIGNED",
      message: `MACE Parallel Assignment: Subtask '${child.title}' assigned to agent '${agent.name}'.`,
      details: { childTaskId: child.id, agentId: agent.id, agentName: agent.name, role: agent.role },
    });
  }

  if (assignedMatches.length > 0) {
    console.log(`[MACE] Manager Runtime: Assigned ${assignedMatches.length} subtasks to agents.`);
  }

  // 5. Check if any parent task has ALL child subtasks COMPLETED and needs merging
  const parentIds = Array.from(new Set(subtaskLinks.map((l) => l.parent_task_id)));
  for (const pId of parentIds) {
    const { data: parentTask } = await supabase
      .from("tasks")
      .select("id, status")
      .eq("id", pId)
      .maybeSingle();

    if (!parentTask || parentTask.status === "COMPLETED") continue;

    const pSubLinks = subtaskLinks.filter((l) => l.parent_task_id === pId);
    const pChildIds = pSubLinks.map((l) => l.child_task_id);
    const pChildTasks = childTasks.filter((t) => pChildIds.includes(t.id));

    if (pChildTasks.length === pSubLinks.length && pChildTasks.every((t) => t.status === "COMPLETED")) {
      console.log(`[MACE ORCHESTRATOR TICK] Parent ${pId} has all ${pChildTasks.length} subtasks completed. Executing Merge Engine...`);

      try {
        const { mergeMaceChildOutputs } = await import("./mace-merger");
        await mergeMaceChildOutputs(pId, pChildTasks);
      } catch (mErr) {
        console.error("[MACE MERGER ERROR IN ORCHESTRATOR]:", mErr);
      }

      try {
        const { mergeSubtaskResultsIntoParent } = await import("../multi-agent/merge-results");
        await mergeSubtaskResultsIntoParent(pId, pChildTasks);
      } catch (sErr) {
        console.error("[SUBTASK MERGE ERROR IN ORCHESTRATOR]:", sErr);
      }

      const nowStr = new Date().toISOString();
      const { error: pUpdateErr } = await supabase
        .from("tasks")
        .update({
          status: "COMPLETED",
          progress: 100,
          completed_at: nowStr,
          updated_at: nowStr,
        })
        .eq("id", pId);

      if (pUpdateErr) {
        console.error("Parent update FAILED");
      } else {
        console.log("Parent updated to COMPLETED");
      }

      await supabase.from("task_events").insert({
        task_id: pId,
        event_type: "PARENT_COMPLETED",
        message: `MACE Orchestrator Tick: All ${pChildTasks.length} subtasks completed! Parent marked COMPLETED.`,
        details: { totalSubtasks: pChildTasks.length, status: "COMPLETED", progress: 100 },
      });
    }
  }

  return {
    processedSubtasks: childTasks.length,
    assignedMatches,
    unlockedSubtasks: unlockedCount,
  };
}
