"use server";

/**
 * services/execution-engine/engine.ts
 *
 * Aura OS Execution Engine v2
 * Orchestrates ASSIGNED and RUNNING tasks through the multi-step execution pipeline:
 * Context Building -> Planner -> Run Manager -> Multi-Step Tool Loop -> Memory Auto-Save -> Completed State.
 * Fully database-driven without external LLM API calls.
 * Logs explicit skip reasons for invalid states or missing agent assignments.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { buildExecutionContext } from "./context-builder";
import { buildPrompt } from "./prompt-builder";
import { createAndTransitionRun } from "./run-manager";
import { executeMultiStepLoop } from "./execution-loop";
import type { TaskRow } from "@/types/task";
import type { AgentRow } from "@/types/agent";
import type { ExecutionEngineResult } from "./types";

/**
 * Executes one tick of the Execution Engine v2.
 * Scans all ASSIGNED and RUNNING tasks, builds context/plan, executes multi-step tool-calling loop,
 * saves long-term memories, attaches artifacts, and completes execution.
 */
export async function runExecutionEngineTick(): Promise<ExecutionEngineResult> {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") {
      return { processedCount: 0, results: [] };
    }

    // 1. Scan tasks with status ASSIGNED or RUNNING (continue executing running tasks)
    const { data: rawTasks, error: taskErr } = await supabase
      .from("tasks")
      .select("*")
      .in("status", ["ASSIGNED", "RUNNING"])
      .order("created_at", { ascending: true });

    if (taskErr || !rawTasks || rawTasks.length === 0) {
      return { processedCount: 0, results: [] };
    }

    const targetTasks = rawTasks as TaskRow[];

    // Fetch assigned agents
    const agentIds = Array.from(
      new Set(targetTasks.map((t) => t.assigned_agent_id).filter((id): id is string => Boolean(id)))
    );

    let agentMap: Record<string, AgentRow> = {};
    if (agentIds.length > 0) {
      const { data: agents } = await supabase.from("agents").select("*").in("id", agentIds);
      if (agents) {
        agentMap = Object.fromEntries(agents.map((a: AgentRow) => [a.id, a]));
      }
    }

    const results: ExecutionEngineResult["results"] = [];
    const now = new Date().toISOString();

    for (const task of targetTasks) {
      // Skip Validation 0: Parent task orchestrating child subtasks
      const { data: parentSubtaskLink } = await supabase
        .from("task_subtasks")
        .select("id")
        .eq("parent_task_id", task.id)
        .limit(1);

      if (parentSubtaskLink && parentSubtaskLink.length > 0) {
        console.log(`[MACE] Execution Engine: Task ${task.id} skipped (Reason: Parent task orchestrating subtasks).`);
        await supabase.from("task_events").insert({
          task_id: task.id,
          event_type: "EXECUTION_SKIPPED",
          message: "Execution skipped: Parent task is orchestrating child subtasks.",
          details: { reason: "skipped: parent task orchestrating subtasks" },
        });
        continue;
      }

      // Skip Validation 1: Already completed or in terminal state
      if (["COMPLETED", "FAILED", "CANCELLED"].includes(task.status)) {
        await supabase.from("task_events").insert({
          task_id: task.id,
          event_type: "EXECUTION_SKIPPED",
          message: `Execution skipped: Task already in terminal state (${task.status}).`,
          details: { status: task.status, reason: "skipped: task already completed or terminal" },
        });
        continue;
      }

      // Skip Validation 2: No assigned agent ID
      if (!task.assigned_agent_id) {
        await supabase.from("task_events").insert({
          task_id: task.id,
          event_type: "EXECUTION_SKIPPED",
          message: "Execution skipped: No assigned agent attached to task.",
          details: { reason: "skipped: no assigned agent" },
        });
        continue;
      }

      // Skip Validation 3: Assigned agent ID not found in database
      const agent = agentMap[task.assigned_agent_id];
      if (!agent) {
        await supabase.from("task_events").insert({
          task_id: task.id,
          event_type: "EXECUTION_SKIPPED",
          message: `Execution skipped: Assigned agent '${task.assigned_agent_id}' not found in database.`,
          details: { assigned_agent_id: task.assigned_agent_id, reason: "skipped: agent not found" },
        });
        continue;
      }

      console.log(`[MACE][Execution]\nRunning child ${task.id}`);

      try {
        // a) Ensure task status is RUNNING & set started_at if not set
        await supabase
          .from("tasks")
          .update({
            status: "RUNNING",
            started_at: task.started_at || now,
            updated_at: now,
          })
          .eq("id", task.id);

        // b) Transition agent status to WORKING (keep using existing assigned agent)
        await supabase
          .from("agents")
          .update({
            status: "WORKING",
            current_task: task.title,
            updated_at: now,
          })
          .eq("id", agent.id);

        // c) Build Execution Context & Prompt (with memory injection)
        const context = await buildExecutionContext(task, agent);
        const prompt = buildPrompt(context);

        // d) Manage Run Lifecycle & Events
        const runId = await createAndTransitionRun({
          agentId: agent.id,
          taskId: task.id,
          taskTitle: task.title,
          prompt,
        });

        // e) Execute Execution Engine v2 Multi-Step Tool Loop (Planning -> Tool Calling -> Reasoning -> Writing -> Memory -> Completed)
        await executeMultiStepLoop({ context, runId });

        // f) Reset agent status back to IDLE
        await supabase
          .from("agents")
          .update({
            status: "IDLE",
            current_task: null,
            last_run: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", agent.id);

        results.push({
          taskId: task.id,
          taskTitle: task.title,
          agentId: agent.id,
          agentName: agent.name,
          runId,
          status: "COMPLETED",
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Provider or execution engine error";
        console.error(`[EXECUTION ENGINE ERROR] Task ${task.id}:`, err);

        // Log Skip / Failure Reason in task_events
        await supabase.from("task_events").insert({
          task_id: task.id,
          agent_id: agent.id,
          event_type: "EXECUTION_SKIPPED",
          message: `Execution failed or skipped: ${errorMsg}`,
          details: { reason: "skipped: provider or loop failed", error: errorMsg },
        });
      }
    }

    return {
      processedCount: results.length,
      results,
    };
  } catch (err) {
    console.error("[EXECUTION ENGINE TICK EXCEPTION]:", err);
    return { processedCount: 0, results: [] };
  }
}
