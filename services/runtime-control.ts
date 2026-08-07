"use server";

/**
 * services/runtime-control.ts
 *
 * Runtime Control Center Service (Aura OS Phase 2)
 * Provides unified orchestration and telemetry across Planner, Manager Runtime,
 * Execution Engine, and Merge Engine.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { decomposeTaskIntoSubtasks } from "@/services/multi-agent/planner";
import { runManagerRuntimeTick } from "@/services/manager-runtime";
import { runExecutionEngineTick } from "@/services/execution-engine";
import { mergeMaceChildOutputs } from "@/services/mace/mace-merger";
import type { TaskRow } from "@/types/task";
import type { ProviderTelemetryStats } from "@/types/provider";
import type { ProviderManagerStatus } from "@/services/providers/provider-manager";

export interface EngineStatusCard {
  name: string;
  key: "planner" | "manager" | "execution" | "merge";
  status: "IDLE" | "RUNNING" | "PAUSED" | "ERROR";
  lastExecutionTime: string | null;
  tasksProcessed: number;
  lastError: string | null;
}

export interface RuntimeStats {
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  busyAgents: number;
  idleAgents: number;
  engines: EngineStatusCard[];
  providerTelemetry?: ProviderTelemetryStats;
  providerManagerStatus?: ProviderManagerStatus;
  toolTelemetry?: {
    totalToolExecutions: number;
    activeToolCalls: number;
    totalRetries: number;
    totalTimeouts: number;
    liveToolLogs: Array<{ id: string; toolId: string; status: string; executionTimeMs: number; time: string }>;
  };
  knowledgeTelemetry?: {
    knowledgeHits: number;
    knowledgeMisses: number;
    avgRetrievalTimeMs: number;
    documentsUsed: number;
    knowledgeSaved: number;
  };
}

export interface RuntimeLogEvent {
  id: string;
  task_id: string | null;
  agent_id: string | null;
  event_type: string;
  message: string;
  created_at: string;
  details?: Record<string, unknown>;
}

// In-Memory Engine Telemetry Store
const engineState: Record<
  "planner" | "manager" | "execution" | "merge",
  { status: "IDLE" | "RUNNING" | "PAUSED" | "ERROR"; lastExecutionTime: string | null; tasksProcessed: number; lastError: string | null }
> = {
  planner: { status: "IDLE", lastExecutionTime: null, tasksProcessed: 0, lastError: null },
  manager: { status: "IDLE", lastExecutionTime: null, tasksProcessed: 0, lastError: null },
  execution: { status: "IDLE", lastExecutionTime: null, tasksProcessed: 0, lastError: null },
  merge: { status: "IDLE", lastExecutionTime: null, tasksProcessed: 0, lastError: null },
};

/** 1. Run Planner Engine */
export async function runPlannerEngineTick(): Promise<{ processedCount: number }> {
  const { supabase } = await getServerContext();
  const now = new Date().toISOString();
  engineState.planner.status = "RUNNING";

  try {
    // Find un-decomposed parent tasks
    const { data: candidateTasks } = await supabase
      .from("tasks")
      .select("*")
      .in("status", ["CREATED", "PENDING"])
      .is("parent_task_id", null);

    let processedCount = 0;
    if (candidateTasks && candidateTasks.length > 0) {
      for (const parentTask of candidateTasks as TaskRow[]) {
        // Skip if task already has subtasks
        const { count } = await supabase
          .from("task_subtasks")
          .select("id", { count: "exact", head: true })
          .eq("parent_task_id", parentTask.id);

        if (count && count > 0) continue;

        // Log Planner Started
        await supabase.from("task_events").insert({
          task_id: parentTask.id,
          event_type: "PLANNER_STARTED",
          message: `Planner started decomposing parent task '${parentTask.title}'.`,
        });

        const decompResult = await decomposeTaskIntoSubtasks(parentTask);
        const subtasksCount = decompResult.childTasks.length;
        processedCount += subtasksCount;

        // Log Planner Finished
        await supabase.from("task_events").insert({
          task_id: parentTask.id,
          event_type: "PLANNER_FINISHED",
          message: `Planner generated ${subtasksCount} subtasks for '${parentTask.title}'.`,
        });
      }
    }

    engineState.planner.status = "IDLE";
    engineState.planner.lastExecutionTime = now;
    engineState.planner.tasksProcessed += processedCount;
    engineState.planner.lastError = null;

    return { processedCount };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Planner error";
    engineState.planner.status = "ERROR";
    engineState.planner.lastError = errorMsg;
    throw err;
  }
}

/** 2. Run Manager Engine */
export async function runManagerEngineTick(): Promise<{ processedCount: number }> {
  const now = new Date().toISOString();
  engineState.manager.status = "RUNNING";

  try {
    const summary = await runManagerRuntimeTick();
    const processedCount = summary.matchedCount ?? summary.processedTasks ?? 0;

    engineState.manager.status = "IDLE";
    engineState.manager.lastExecutionTime = now;
    engineState.manager.tasksProcessed += processedCount;
    engineState.manager.lastError = null;

    return { processedCount };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Manager runtime error";
    engineState.manager.status = "ERROR";
    engineState.manager.lastError = errorMsg;
    throw err;
  }
}

/** 3. Run Execution Engine */
export async function runExecutionEngineTickService(): Promise<{ processedCount: number }> {
  const now = new Date().toISOString();
  engineState.execution.status = "RUNNING";

  try {
    const result = await runExecutionEngineTick();
    const processedCount = result.processedCount || 0;

    engineState.execution.status = "IDLE";
    engineState.execution.lastExecutionTime = now;
    engineState.execution.tasksProcessed += processedCount;
    engineState.execution.lastError = null;

    return { processedCount };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Execution engine error";
    engineState.execution.status = "ERROR";
    engineState.execution.lastError = errorMsg;
    throw err;
  }
}

/** 4. Run Merge Engine */
export async function runMergeEngineTick(): Promise<{ processedCount: number }> {
  const { supabase } = await getServerContext();
  const now = new Date().toISOString();
  engineState.merge.status = "RUNNING";

  try {
    // Find parent tasks in WAITING status
    const { data: waitingParents } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "WAITING")
      .is("parent_task_id", null);

    let processedCount = 0;
    if (waitingParents && waitingParents.length > 0) {
      for (const parent of waitingParents as TaskRow[]) {
        const { data: subtaskLinks } = await supabase
          .from("task_subtasks")
          .select("child_task_id")
          .eq("parent_task_id", parent.id);

        if (!subtaskLinks || subtaskLinks.length === 0) continue;

        const childIds = subtaskLinks.map((s) => s.child_task_id);
        const { data: childTasks } = await supabase
          .from("tasks")
          .select("*")
          .in("id", childIds);

        if (!childTasks) continue;

        const allCompleted = childTasks.every((t) => t.status === "COMPLETED");
        if (allCompleted) {
          await mergeMaceChildOutputs(parent.id, childTasks as TaskRow[]);
          await supabase
            .from("tasks")
            .update({
              status: "COMPLETED",
              progress: 100,
              completed_at: now,
              updated_at: now,
            })
            .eq("id", parent.id);

          processedCount++;
        }
      }
    }

    engineState.merge.status = "IDLE";
    engineState.merge.lastExecutionTime = now;
    engineState.merge.tasksProcessed += processedCount;
    engineState.merge.lastError = null;

    return { processedCount };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Merge engine error";
    engineState.merge.status = "ERROR";
    engineState.merge.lastError = errorMsg;
    throw err;
  }
}

/** 5. Run All Engines sequentially (Auto Mode / Run All) */
export async function runFullOrchestrationTick(): Promise<{
  plannerCount: number;
  managerCount: number;
  executionCount: number;
  mergeCount: number;
}> {
  const p = await runPlannerEngineTick();
  const m = await runManagerEngineTick();
  const e = await runExecutionEngineTickService();
  const mg = await runMergeEngineTick();

  return {
    plannerCount: p.processedCount,
    managerCount: m.processedCount,
    executionCount: e.processedCount,
    mergeCount: mg.processedCount,
  };
}

/** 6. Get Live Telemetry & Statistics */
export async function getRuntimeStats(): Promise<RuntimeStats> {
  const { supabase } = await getServerContext();

  const [
    { count: pendingTasks },
    { count: runningTasks },
    { count: completedTasks },
    { count: failedTasks },
    { count: busyAgents },
    { count: idleAgents },
  ] = await Promise.all([
    supabase.from("tasks").select("*", { count: "exact", head: true }).in("status", ["CREATED", "PENDING", "QUEUED", "WAITING"]),
    supabase.from("tasks").select("*", { count: "exact", head: true }).in("status", ["RUNNING", "ASSIGNED", "WORKING"]),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "COMPLETED"),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "FAILED"),
    supabase.from("agents").select("*", { count: "exact", head: true }).eq("status", "WORKING"),
    supabase.from("agents").select("*", { count: "exact", head: true }).eq("status", "IDLE"),
  ]);

  const engines: EngineStatusCard[] = [
    {
      name: "MACE Planner Engine",
      key: "planner",
      status: engineState.planner.status,
      lastExecutionTime: engineState.planner.lastExecutionTime,
      tasksProcessed: engineState.planner.tasksProcessed,
      lastError: engineState.planner.lastError,
    },
    {
      name: "Manager Runtime Engine",
      key: "manager",
      status: engineState.manager.status,
      lastExecutionTime: engineState.manager.lastExecutionTime,
      tasksProcessed: engineState.manager.tasksProcessed,
      lastError: engineState.manager.lastError,
    },
    {
      name: "Execution Engine v2",
      key: "execution",
      status: engineState.execution.status,
      lastExecutionTime: engineState.execution.lastExecutionTime,
      tasksProcessed: engineState.execution.tasksProcessed,
      lastError: engineState.execution.lastError,
    },
    {
      name: "MACE Merge Engine",
      key: "merge",
      status: engineState.merge.status,
      lastExecutionTime: engineState.merge.lastExecutionTime,
      tasksProcessed: engineState.merge.tasksProcessed,
      lastError: engineState.merge.lastError,
    },
  ];

  let providerTelemetry: ProviderTelemetryStats | undefined;
  let providerManagerStatus: ProviderManagerStatus | undefined;
  let toolTelemetry: {
    totalToolExecutions: number;
    activeToolCalls: number;
    totalRetries: number;
    totalTimeouts: number;
    liveToolLogs: Array<{ id: string; toolId: string; status: string; executionTimeMs: number; time: string }>;
  } | undefined;

  try {
    const { getProviderTelemetry } = await import("@/services/providers/provider-settings-service");
    const { ProviderManager } = await import("@/services/providers/provider-manager");
    const { ToolOrchestrator } = await import("@/services/tools/tool-orchestrator");

    const [
      pTel,
      pStatus,
      { count: toolExecCount },
      { count: timeoutCount },
      { data: retryData },
      { data: recentTools },
    ] = await Promise.all([
      getProviderTelemetry(),
      ProviderManager.getStatus(),
      supabase.from("tool_executions").select("*", { count: "exact", head: true }),
      supabase.from("tool_executions").select("*", { count: "exact", head: true }).eq("status", "TIMED_OUT"),
      supabase.from("tool_executions").select("attempt_count").gt("attempt_count", 1),
      supabase.from("tool_executions").select("id, tool_id, status, execution_time_ms, created_at").order("created_at", { ascending: false }).limit(10),
    ]);

    providerTelemetry = pTel;
    providerManagerStatus = pStatus;

    const inMemoryTelemetry = ToolOrchestrator.getTelemetry();
    const totalRetries = retryData ? retryData.reduce((acc, row) => acc + (row.attempt_count - 1), 0) : 0;
    const liveToolLogs = recentTools
      ? recentTools.map((row) => ({
          id: row.id,
          toolId: row.tool_id,
          status: row.status,
          executionTimeMs: row.execution_time_ms,
          time: new Date(row.created_at).toLocaleTimeString(),
        }))
      : [];

    toolTelemetry = {
      totalToolExecutions: (toolExecCount ?? 0) || inMemoryTelemetry.totalToolExecutions,
      activeToolCalls: inMemoryTelemetry.activeToolCalls,
      totalRetries,
      totalTimeouts: (timeoutCount ?? 0) || inMemoryTelemetry.totalTimeouts,
      liveToolLogs,
    };
  } catch {
    // Ignore if settings service fails
  }

    const { getKnowledgeTelemetryStats } = await import("@/services/knowledge-retrieval");
    const kStats = await getKnowledgeTelemetryStats();

    return {
      pendingTasks: pendingTasks || 0,
      runningTasks: runningTasks || 0,
      completedTasks: completedTasks || 0,
      failedTasks: failedTasks || 0,
      busyAgents: busyAgents || 0,
      idleAgents: idleAgents || 0,
      engines,
      providerTelemetry,
      providerManagerStatus,
      toolTelemetry,
      knowledgeTelemetry: kStats,
    };
}

/** 7. Get Live Execution Logs */
export async function getRuntimeLogs(limit = 40): Promise<RuntimeLogEvent[]> {
  try {
    const { supabase } = await getServerContext();
    const { data: events, error } = await supabase
      .from("task_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return (events as RuntimeLogEvent[]) || [];
  } catch {
    return [];
  }
}
