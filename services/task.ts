"use server";

/**
 * services/task.ts
 *
 * Task Orchestrator Foundation Service Layer.
 * Central task management for Aura OS agents & owner workflows.
 * Complete CRUD, assignment management, state transitions, events logging, and artifacts storage.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { runManagerRuntimeTick } from "./manager-runtime";
import type { AgentRow } from "@/types/agent";
import type {
  TaskRow,
  TaskAssignmentRow,
  TaskEventRow,
  TaskArtifactRow,
  FullTaskDetails,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskFilters,
  TaskStatus,
  MergedOutputRow,
} from "@/types/task";

/**
 * Fetches all tasks for current user with optional filters.
 * Joined with assigned agent details.
 */
export async function getTasks(filters?: TaskFilters): Promise<TaskRow[]> {
  try {
    const { supabase, user } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") return [];

    let query = supabase
      .from("tasks")
      .select("*")
      .or(`owner_id.eq.${user.id},owner_id.is.null`)
      .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "ALL") {
      query = query.eq("status", filters.status);
    }

    if (filters?.priority && filters.priority !== "ALL") {
      query = query.eq("priority", filters.priority);
    }

    if (filters?.agentId && filters.agentId !== "ALL") {
      query = query.eq("assigned_agent_id", filters.agentId);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data: tasks, error } = await query;
    if (error || !tasks || tasks.length === 0) return [];

    // Fetch agents for joined display
    const agentIds = Array.from(
      new Set(tasks.map((t) => t.assigned_agent_id).filter((id): id is string => Boolean(id)))
    );

    let agentMap: Record<string, AgentRow> = {};
    if (agentIds.length > 0) {
      const { data: agents } = await supabase.from("agents").select("*").in("id", agentIds);
      if (agents) {
        agentMap = Object.fromEntries(agents.map((a: AgentRow) => [a.id, a]));
      }
    }

    return tasks.map((t) => ({
      ...t,
      assigned_agent: t.assigned_agent_id ? agentMap[t.assigned_agent_id] || null : null,
    })) as TaskRow[];
  } catch (err) {
    console.error("[GET TASKS EXCEPTION]:", err);
    return [];
  }
}

/**
 * Fetches single task full details (task, assignedAgent, assignments, events, artifacts).
 */
export async function getTaskById(taskId: string): Promise<FullTaskDetails | null> {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") return null;

    const { data: task, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (error || !task) return null;

    // Fetch assigned agent if present
    let assignedAgent: AgentRow | null = null;
    if (task.assigned_agent_id) {
      const { data: agent } = await supabase
        .from("agents")
        .select("*")
        .eq("id", task.assigned_agent_id)
        .single();
      if (agent) assignedAgent = agent as AgentRow;
    }

    // Parallel fetch sub-tables using Promise.allSettled
    const [assignmentsRes, eventsRes, artifactsRes] = await Promise.allSettled([
      supabase.from("task_assignments").select("*").eq("task_id", taskId).order("assigned_at", { ascending: false }),
      supabase.from("task_events").select("*").eq("task_id", taskId).order("created_at", { ascending: false }),
      supabase.from("task_artifacts").select("*").eq("task_id", taskId).order("created_at", { ascending: false }),
    ]);

    const assignments = assignmentsRes.status === "fulfilled" && !assignmentsRes.value.error ? assignmentsRes.value.data : [];
    const events = eventsRes.status === "fulfilled" && !eventsRes.value.error ? eventsRes.value.data : [];
    const artifacts = artifactsRes.status === "fulfilled" && !artifactsRes.value.error ? artifactsRes.value.data : [];

    return {
      task: { ...task, assigned_agent: assignedAgent } as TaskRow,
      assignedAgent,
      assignments: (assignments || []) as TaskAssignmentRow[],
      events: (events || []) as TaskEventRow[],
      artifacts: (artifacts || []) as TaskArtifactRow[],
    };
  } catch (err) {
    console.error("[GET TASK BY ID EXCEPTION]:", err);
    return null;
  }
}

/**
 * Creates a new task and logs initial CREATED task event.
 * Automatically triggers Manager Runtime tick for role-based agent matching if unassigned.
 */
export async function createTask(payload: CreateTaskPayload): Promise<TaskRow> {
  const { supabase, user } = await getServerContext();
  const ownerId = (user?.id && user.id !== "00000000-0000-0000-0000-000000000000" && !user.id.startsWith("dev-")) ? user.id : null;

  const initialStatus: TaskStatus = payload.assigned_agent_id ? "ASSIGNED" : "CREATED";

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      owner_id: ownerId,
      title: payload.title,
      description: payload.description ?? null,
      status: initialStatus,
      priority: payload.priority ?? "NORMAL",
      assigned_agent_id: payload.assigned_agent_id ?? null,
      requested_by: "OWNER",
      due_date: payload.due_date ?? null,
      estimated_duration: payload.estimated_duration ?? null,
      progress: 0,
      metadata: payload.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) throw new Error(`Create Task Error: ${error.message}`);

  const createdTask = data as TaskRow;

  // Log CREATED event
  try {
    await supabase.from("task_events").insert({
      task_id: createdTask.id,
      agent_id: createdTask.assigned_agent_id,
      event_type: "CREATED",
      message: `Task '${createdTask.title}' created with priority ${createdTask.priority}.`,
      details: { priority: createdTask.priority, assigned_agent_id: createdTask.assigned_agent_id },
    });

    if (createdTask.assigned_agent_id) {
      await supabase.from("task_assignments").insert({
        task_id: createdTask.id,
        agent_id: createdTask.assigned_agent_id,
        role: "PRIMARY",
      });
    }
  } catch {
    // Ignore if sub-tables missing
  }

  // Auto-decompose Parent Task into MACE v1 Child Subtasks
  const isChildSubtask = Boolean(payload.metadata?.parentTaskId || payload.metadata?.dependsOnTaskId);
  const skipDecompose = Boolean(payload.metadata?.skipAutoDecompose);

  if (!isChildSubtask && !skipDecompose) {
    console.log(`[MACE] Parent Task Created: ${createdTask.id} ('${createdTask.title}'). Triggering Planner...`);
    try {
      const { decomposeParentTaskMace } = await import("./mace/mace-planner");
      await decomposeParentTaskMace(createdTask);
    } catch (maceErr) {
      console.error(`[MACE] Parent Task ${createdTask.id} Decomposition Failed:`, maceErr);
    }
  } else if (isChildSubtask) {
    console.log(`[MACE] Child Subtask Created: ${createdTask.id} (Parent: ${payload.metadata?.parentTaskId || 'N/A'})`);
  } else if (!createdTask.assigned_agent_id) {
    // Trigger Manager Runtime tick for automatic role matching
    try {
      await runManagerRuntimeTick();
    } catch {
      // Ignore
    }
  }

  // Refetch latest task state in case manager runtime or mace planner updated it
  const { data: latest } = await supabase.from("tasks").select("*").eq("id", createdTask.id).single();

  return (latest as TaskRow) || createdTask;
}

/**
 * Updates task fields and logs an UPDATED event.
 */
export async function updateTask(taskId: string, payload: UpdateTaskPayload): Promise<TaskRow> {
  const { supabase } = await getServerContext();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.priority !== undefined) updateData.priority = payload.priority;
  if (payload.assigned_agent_id !== undefined) updateData.assigned_agent_id = payload.assigned_agent_id;
  if (payload.progress !== undefined) updateData.progress = payload.progress;
  if (payload.due_date !== undefined) updateData.due_date = payload.due_date;
  if (payload.estimated_duration !== undefined) updateData.estimated_duration = payload.estimated_duration;
  if (payload.metadata !== undefined) updateData.metadata = payload.metadata;

  const { data, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw new Error(`Update Task Error: ${error.message}`);

  try {
    await supabase.from("task_events").insert({
      task_id: taskId,
      event_type: "UPDATED",
      message: `Task details updated.`,
      details: updateData,
    });
  } catch {
    // Ignore
  }

  return data as TaskRow;
}

/**
 * Assigns a task to an agent, creates task_assignments record & logs event.
 */
export async function assignTask(taskId: string, agentId: string): Promise<TaskRow> {
  const { supabase } = await getServerContext();

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      assigned_agent_id: agentId,
      status: "ASSIGNED",
      updated_at: now,
    })
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw new Error(`Assign Task Error: ${error.message}`);

  try {
    await supabase.from("task_assignments").insert({
      task_id: taskId,
      agent_id: agentId,
      role: "PRIMARY",
      assigned_at: now,
    });

    await supabase.from("task_events").insert({
      task_id: taskId,
      agent_id: agentId,
      event_type: "ASSIGNED",
      message: `Task assigned to agent ID ${agentId}.`,
    });
  } catch {
    // Ignore
  }

  return data as TaskRow;
}

/**
 * Starts task execution (status: RUNNING, started_at: now).
 */
export async function startTask(taskId: string): Promise<TaskRow> {
  const { supabase } = await getServerContext();

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "RUNNING",
      started_at: now,
      updated_at: now,
    })
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw new Error(`Start Task Error: ${error.message}`);

  try {
    await supabase.from("task_events").insert({
      task_id: taskId,
      agent_id: data.assigned_agent_id,
      event_type: "STARTED",
      message: `Task execution started.`,
    });
  } catch {
    // Ignore
  }

  return data as TaskRow;
}

/**
 * Completes task (status: COMPLETED, progress: 100, completed_at: now).
 */
export async function completeTask(taskId: string, outputDetails?: Record<string, unknown>): Promise<TaskRow> {
  const { supabase } = await getServerContext();

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "COMPLETED",
      progress: 100,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw new Error(`Complete Task Error: ${error.message}`);

  console.log(`[MACE] completeTask Fired: Task ${taskId} marked COMPLETED.`);

  try {
    await supabase.from("task_events").insert({
      task_id: taskId,
      agent_id: data.assigned_agent_id,
      event_type: "COMPLETED",
      message: `Task completed successfully.`,
      details: outputDetails ?? {},
    });
  } catch {
    // Ignore
  }

  // Trigger Parent Task Resumption & Multi-Agent Dependency Unlock Check
  try {
    const { checkAndResumeParentTask } = await import("./task-delegation");
    await checkAndResumeParentTask(taskId);

    const { checkAndUnlockNextSubtasks } = await import("./multi-agent/dependency-manager");
    await checkAndUnlockNextSubtasks(taskId);
  } catch (depErr) {
    console.error("[TASK DELEGATION & SUBTASK UNLOCK CHECK ERROR]:", depErr);
  }

  return data as TaskRow;
}

/**
 * Fails task (status: FAILED).
 */
export async function failTask(taskId: string, errorMessage: string): Promise<TaskRow> {
  const { supabase } = await getServerContext();

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "FAILED",
      updated_at: now,
    })
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw new Error(`Fail Task Error: ${error.message}`);

  try {
    await supabase.from("task_events").insert({
      task_id: taskId,
      agent_id: data.assigned_agent_id,
      event_type: "FAILED",
      message: `Task failed: ${errorMessage}`,
      details: { error: errorMessage },
    });
  } catch {
    // Ignore
  }

  return data as TaskRow;
}

/**
 * Cancels task (status: CANCELLED).
 */
export async function cancelTask(taskId: string, reason?: string): Promise<TaskRow> {
  const { supabase } = await getServerContext();

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "CANCELLED",
      updated_at: now,
    })
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw new Error(`Cancel Task Error: ${error.message}`);

  try {
    await supabase.from("task_events").insert({
      task_id: taskId,
      agent_id: data.assigned_agent_id,
      event_type: "CANCELLED",
      message: reason || "Task cancelled by user.",
    });
  } catch {
    // Ignore
  }

  return data as TaskRow;
}

/**
 * Adds an event log to a task timeline.
 */
export async function addTaskEvent(
  taskId: string,
  eventType: string,
  message: string,
  details?: Record<string, unknown>,
  agentId?: string
): Promise<TaskEventRow> {
  const { supabase } = await getServerContext();

  const { data, error } = await supabase
    .from("task_events")
    .insert({
      task_id: taskId,
      agent_id: agentId ?? null,
      event_type: eventType,
      message,
      details: details ?? {},
    })
    .select("*")
    .single();

  if (error) throw new Error(`Add Task Event Error: ${error.message}`);
  return data as TaskEventRow;
}

/**
 * Adds an artifact record to a task.
 */
export async function addTaskArtifact(
  taskId: string,
  title: string,
  artifactType: string,
  contentOrUrl: string,
  metadata?: Record<string, unknown>
): Promise<TaskArtifactRow> {
  const { supabase } = await getServerContext();

  const { data, error } = await supabase
    .from("task_artifacts")
    .insert({
      task_id: taskId,
      title,
      artifact_type: artifactType,
      content_or_url: contentOrUrl,
      metadata: metadata ?? {},
    })
    .select("*")
    .single();

  if (error) throw new Error(`Add Task Artifact Error: ${error.message}`);
  return data as TaskArtifactRow;
}

/**
 * Helper: Get tasks categorized by state for a specific Agent (Active, Completed, Failed).
 */
export async function getTasksForAgent(agentId: string): Promise<{
  active: TaskRow[];
  completed: TaskRow[];
  failed: TaskRow[];
  events: TaskEventRow[];
}> {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") {
      return { active: [], completed: [], failed: [], events: [] };
    }

    const [tasksRes, eventsRes] = await Promise.allSettled([
      supabase.from("tasks").select("*").eq("assigned_agent_id", agentId).order("created_at", { ascending: false }),
      supabase.from("task_events").select("*").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(20),
    ]);

    const tasks = tasksRes.status === "fulfilled" && !tasksRes.value.error ? (tasksRes.value.data as TaskRow[]) : [];
    const events = eventsRes.status === "fulfilled" && !eventsRes.value.error ? (eventsRes.value.data as TaskEventRow[]) : [];

    const active = tasks.filter((t) => ["ASSIGNED", "RUNNING", "WAITING", "QUEUED", "CREATED"].includes(t.status));
    const completed = tasks.filter((t) => t.status === "COMPLETED");
    const failed = tasks.filter((t) => t.status === "FAILED");

    return { active, completed, failed, events };
  } catch (err) {
    console.error("[GET TASKS FOR AGENT ERROR]:", err);
    return { active: [], completed: [], failed: [], events: [] };
  }
}

export async function getMergedOutputForTask(parentTaskId: string): Promise<MergedOutputRow | null> {
  try {
    const { supabase } = await getServerContext();
    const { data, error } = await supabase
      .from("merged_outputs")
      .select("*")
      .eq("parent_task_id", parentTaskId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as MergedOutputRow;
  } catch (err) {
    console.error("[GET MERGED OUTPUT ERROR]:", err);
    return null;
  }
}
