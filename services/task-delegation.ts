"use server";

/**
 * services/task-delegation.ts
 *
 * Multi-Agent Collaboration & Sub-Task Delegation Service Layer.
 * Manages parent-child task dependencies, subtask creation, timeline event logging,
 * and automatic parent task resumption when child tasks complete.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type { TaskRow, TaskDependencyRow, TaskPriority } from "@/types/task";
import { createTask } from "./task";

export interface SubtaskCreationResult {
  childTask: TaskRow;
  dependency: TaskDependencyRow;
}

/**
 * Creates a child subtask spawned by an agent and links it to a parent task.
 * Transitions parent task status to 'WAITING' until all subtasks complete.
 */
export async function createChildTask(
  parentTaskId: string,
  creatorAgentId: string,
  title: string,
  description: string,
  assignedAgentId?: string,
  priority: TaskPriority = "NORMAL"
): Promise<SubtaskCreationResult> {
  const { supabase } = await getServerContext();
  const now = new Date().toISOString();

  // 1. Create the child task via createTask
  const childTask = await createTask({
    title,
    description,
    priority,
    assigned_agent_id: assignedAgentId || null,
    metadata: {
      parentTaskId,
      spawnedByAgentId: creatorAgentId,
      requestedBy: `Agent:${creatorAgentId.substring(0, 8)}`,
    },
  });

  // 2. Insert into task_dependencies
  const { data: dep, error: depErr } = await supabase
    .from("task_dependencies")
    .insert({
      parent_task_id: parentTaskId,
      child_task_id: childTask.id,
      created_by_agent: creatorAgentId,
      dependency_type: "REQUIRES_COMPLETION",
      status: "PENDING",
    })
    .select("*")
    .single();

  if (depErr || !dep) {
    throw new Error(`Failed to create task dependency: ${depErr?.message}`);
  }

  // 3. Transition parent task status: RUNNING -> WAITING
  await supabase
    .from("tasks")
    .update({
      status: "WAITING",
      updated_at: now,
    })
    .eq("id", parentTaskId);

  // 4. Log Timeline Event 1: SUBTASK_CREATED (on parent task)
  await supabase.from("task_events").insert({
    task_id: parentTaskId,
    agent_id: creatorAgentId,
    event_type: "SUBTASK_CREATED",
    message: `Subtask created: "${childTask.title}"`,
    details: {
      child_task_id: childTask.id,
      child_title: childTask.title,
      assigned_agent_id: assignedAgentId || null,
    },
  });

  // 5. Log Timeline Event 2: SUBTASK_ASSIGNED (on child task)
  await supabase.from("task_events").insert({
    task_id: childTask.id,
    agent_id: assignedAgentId || null,
    event_type: "SUBTASK_ASSIGNED",
    message: `Subtask assigned from parent task`,
    details: {
      parent_task_id: parentTaskId,
      creator_agent_id: creatorAgentId,
    },
  });

  return {
    childTask,
    dependency: dep as TaskDependencyRow,
  };
}

/**
 * Checks if a completed child task satisfies parent task dependencies.
 * If all subtasks for the parent are completed, resumes the parent task.
 */
export async function checkAndResumeParentTask(childTaskId: string): Promise<boolean> {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") return false;

    // 1. Find dependency entry for this child task
    const { data: dep } = await supabase
      .from("task_dependencies")
      .select("*")
      .eq("child_task_id", childTaskId)
      .maybeSingle();

    if (!dep) return false;

    const parentTaskId = dep.parent_task_id;
    const now = new Date().toISOString();

    // 2. Mark this dependency as SATISFIED
    await supabase
      .from("task_dependencies")
      .update({ status: "SATISFIED" })
      .eq("id", dep.id);

    // Log Event: SUBTASK_COMPLETED (on parent task)
    await supabase.from("task_events").insert({
      task_id: parentTaskId,
      agent_id: dep.created_by_agent,
      event_type: "SUBTASK_COMPLETED",
      message: `Child subtask completed successfully.`,
      details: { child_task_id: childTaskId },
    });

    // 3. Query all dependencies for parent task
    const { data: allDeps } = await supabase
      .from("task_dependencies")
      .select("status")
      .eq("parent_task_id", parentTaskId);

    const pendingDeps = (allDeps || []).filter((d) => d.status !== "SATISFIED");

    // 4. If all subtasks are satisfied, resume parent task
    if (pendingDeps.length === 0) {
      await supabase
        .from("tasks")
        .update({
          status: "RUNNING",
          updated_at: now,
        })
        .eq("id", parentTaskId);

      // Log Event: PARENT_RESUMED (on parent task)
      await supabase.from("task_events").insert({
        task_id: parentTaskId,
        agent_id: dep.created_by_agent,
        event_type: "PARENT_RESUMED",
        message: `All child subtasks completed. Parent task resumed.`,
        details: { parent_task_id: parentTaskId, total_subtasks: (allDeps || []).length },
      });

      return true;
    }

    return false;
  } catch (err) {
    console.error("[CHECK AND RESUME PARENT TASK ERROR]:", err);
    return false;
  }
}

/**
 * Fetches all child tasks for a parent task with dependency status.
 */
export async function getChildTasks(parentTaskId: string): Promise<TaskDependencyRow[]> {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") return [];

    const { data, error } = await supabase
      .from("task_dependencies")
      .select(`
        *,
        child_task:tasks!task_dependencies_child_task_id_fkey(*, assigned_agent:agents(*))
      `)
      .eq("parent_task_id", parentTaskId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as TaskDependencyRow[];
  } catch (err) {
    console.error("[GET CHILD TASKS ERROR]:", err);
    return [];
  }
}

/**
 * Fetches all tasks delegated by an agent (Delegated) and assigned to an agent as subtasks (Received).
 */
export async function getAgentDelegationStats(agentId: string) {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") {
      return { delegated: [], received: [] };
    }

    const [createdRes, receivedRes] = await Promise.allSettled([
      supabase
        .from("task_dependencies")
        .select(`*, child_task:tasks!task_dependencies_child_task_id_fkey(*, assigned_agent:agents(*))`)
        .eq("created_by_agent", agentId),
      supabase
        .from("tasks")
        .select(`*, assigned_agent:agents(*)`)
        .eq("assigned_agent_id", agentId)
        .not("metadata->parentTaskId", "is", null),
    ]);

    const delegated =
      createdRes.status === "fulfilled" && !createdRes.value.error
        ? createdRes.value.data
        : [];
    const received =
      receivedRes.status === "fulfilled" && !receivedRes.value.error
        ? receivedRes.value.data
        : [];

    return {
      delegated: (delegated || []) as TaskDependencyRow[],
      received: (received || []) as TaskRow[],
    };
  } catch (err) {
    console.error("[GET AGENT DELEGATION STATS ERROR]:", err);
    return { delegated: [], received: [] };
  }
}

/**
 * Fetches all task dependencies in the system for Manager Dashboard Dependency Graph.
 */
export async function getAllTaskDependencies(): Promise<TaskDependencyRow[]> {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") return [];

    const { data, error } = await supabase
      .from("task_dependencies")
      .select(`
        *,
        parent_task:tasks!task_dependencies_parent_task_id_fkey(*, assigned_agent:agents(*)),
        child_task:tasks!task_dependencies_child_task_id_fkey(*, assigned_agent:agents(*)),
        agent:agents!task_dependencies_created_by_agent_fkey(*)
      `)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as TaskDependencyRow[];
  } catch (err) {
    console.error("[GET ALL TASK DEPENDENCIES ERROR]:", err);
    return [];
  }
}
