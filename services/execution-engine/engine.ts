"use server";

/**
 * services/execution-engine/engine.ts
 *
 * Aura OS Execution Engine v1
 * Orchestrates ASSIGNED tasks through the execution pipeline:
 * Context Building -> Prompt Generation -> Run Management -> WAITING_FOR_MODEL state.
 * Fully database-driven without calling external LLM APIs.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { buildExecutionContext } from "./context-builder";
import { buildPrompt } from "./prompt-builder";
import { createAndTransitionRun } from "./run-manager";
import type { TaskRow } from "@/types/task";
import type { AgentRow } from "@/types/agent";
import type { ExecutionEngineResult } from "./types";

/**
 * Executes one tick of the Execution Engine.
 * Scans all ASSIGNED tasks, compiles prompt context, creates agent_run, and prepares for model execution.
 */
export async function runExecutionEngineTick(): Promise<ExecutionEngineResult> {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") {
      return { processedCount: 0, results: [] };
    }

    // 1. Scan tasks with status ASSIGNED
    const { data: rawTasks, error: taskErr } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "ASSIGNED")
      .order("created_at", { ascending: true });

    if (taskErr || !rawTasks || rawTasks.length === 0) {
      return { processedCount: 0, results: [] };
    }

    const assignedTasks = rawTasks as TaskRow[];

    // Fetch assigned agents
    const agentIds = Array.from(
      new Set(assignedTasks.map((t) => t.assigned_agent_id).filter((id): id is string => Boolean(id)))
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

    for (const task of assignedTasks) {
      if (!task.assigned_agent_id || !agentMap[task.assigned_agent_id]) {
        continue;
      }

      const agent = agentMap[task.assigned_agent_id];

      try {
        // a) Update task status to RUNNING & set started_at
        await supabase
          .from("tasks")
          .update({
            status: "RUNNING",
            started_at: now,
            updated_at: now,
          })
          .eq("id", task.id);

        // b) Keep agent status as WORKING (and refresh timestamps)
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

        results.push({
          taskId: task.id,
          taskTitle: task.title,
          agentId: agent.id,
          agentName: agent.name,
          runId,
          status: "WAITING_FOR_MODEL",
        });
      } catch (err) {
        console.error(`[EXECUTION ENGINE ERROR] Task ${task.id}:`, err);
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
