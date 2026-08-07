"use server";

/**
 * services/manager-runtime.ts
 *
 * Aura OS Manager Runtime v1
 * Central task orchestration engine that automatically assigns unassigned tasks (CREATED/QUEUED)
 * to available IDLE AI agents based on role-matching rules without calling LLMs.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { runExecutionEngineTick } from "./execution-engine";
import type { TaskRow } from "@/types/task";
import type { AgentRow } from "@/types/agent";

export interface ManagerTickMatchResult {
  taskId: string;
  taskTitle: string;
  agentId: string;
  agentName: string;
  agentRole: string;
}

export interface ManagerTickSummary {
  processedTasks: number;
  matchedCount: number;
  remainingQueuedCount: number;
  matches: ManagerTickMatchResult[];
}

/**
 * Role matching helper: calculates relevance score between a task text and an agent's role/name/description.
 */
function calculateRoleMatchScore(taskText: string, agent: AgentRow): number {
  const text = taskText.toLowerCase();
  const role = (agent.role || "").toLowerCase();
  const name = (agent.name || "").toLowerCase();
  const desc = (agent.description || "").toLowerCase();

  let score = 0;

  // Domain keyword rules
  const DOMAIN_KEYWORDS: Record<string, string[]> = {
    seo: ["seo", "keyword", "content", "ranking", "blog", "article", "copywriting"],
    dev: ["code", "dev", "developer", "bug", "api", "build", "fix", "schema", "database", "typescript", "javascript", "sql"],
    design: ["design", "ui", "ux", "layout", "theme", "css", "styling", "mockup", "visual"],
    marketing: ["market", "campaign", "ad", "social", "promo", "email", "growth", "lead"],
    catalog: ["product", "catalog", "inventory", "store", "price", "stock", "category", "collection"],
    analytics: ["analytics", "report", "data", "insight", "metric", "audit"],
  };

  for (const [, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const textHasDomain = keywords.some((kw) => text.includes(kw));
    const agentHasDomain = keywords.some((kw) => role.includes(kw) || name.includes(kw) || desc.includes(kw));

    if (textHasDomain && agentHasDomain) {
      score += 10;
    }
  }

  // General text match score
  if (text.includes(role)) score += 5;
  if (text.includes(name)) score += 5;

  return score;
}

/**
 * Main Manager Runtime Orchestrator Tick.
 * Scans CREATED/QUEUED tasks & IDLE agents, matches by role, and performs atomic assignments.
 */
export async function runManagerRuntimeTick(): Promise<ManagerTickSummary> {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") {
      return { processedTasks: 0, matchedCount: 0, remainingQueuedCount: 0, matches: [] };
    }

    // 0. Check WAITING tasks whose child subtasks have all completed
    try {
      const { runMaceOrchestratorTick } = await import("./mace/mace-orchestrator");
      await runMaceOrchestratorTick();

      const { data: waitingTasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("status", "WAITING");

      if (waitingTasks && waitingTasks.length > 0) {
        const { checkAndResumeParentTask } = await import("./task-delegation");
        for (const wt of waitingTasks) {
          await checkAndResumeParentTask(wt.id);
        }
      }
    } catch (maceErr) {
      console.error("[MACE ORCHESTRATOR TICK ERROR]:", maceErr);
    }

    // 1. Fetch unassigned tasks (CREATED or QUEUED), prioritized by CRITICAL -> HIGH -> NORMAL -> LOW
    const { data: rawTasks, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .in("status", ["CREATED", "QUEUED"])
      .order("created_at", { ascending: true });

    if (taskError || !rawTasks || rawTasks.length === 0) {
      return { processedTasks: 0, matchedCount: 0, remainingQueuedCount: 0, matches: [] };
    }

    // Sort tasks in memory by priority weight
    const PRIORITY_WEIGHTS: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1,
    };

    const unassignedTasks = (rawTasks as TaskRow[]).sort((a, b) => {
      const wA = PRIORITY_WEIGHTS[a.priority] || 2;
      const wB = PRIORITY_WEIGHTS[b.priority] || 2;
      return wB - wA;
    });

    // 2. Fetch available IDLE agents
    const { data: rawAgents, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("status", "IDLE");

    if (agentError || !rawAgents || rawAgents.length === 0) {
      // Leave all tasks in QUEUED state
      return {
        processedTasks: unassignedTasks.length,
        matchedCount: 0,
        remainingQueuedCount: unassignedTasks.length,
        matches: [],
      };
    }

    let availableAgents = [...(rawAgents as AgentRow[])];
    const matches: ManagerTickMatchResult[] = [];
    const now = new Date().toISOString();

    for (const task of unassignedTasks) {
      if (availableAgents.length === 0) break;

      const taskText = `${task.title} ${task.description || ""}`;

      // Score available agents
      const scoredAgents = availableAgents.map((agent) => ({
        agent,
        score: calculateRoleMatchScore(taskText, agent),
      }));

      // Sort by match score descending
      scoredAgents.sort((a, b) => b.score - a.score);

      // Pick best matching agent (or first available idle agent as fallback)
      const selectedAgent = scoredAgents[0].agent;

      // Perform assignment in database
      try {
        // a) Update Task
        await supabase
          .from("tasks")
          .update({
            assigned_agent_id: selectedAgent.id,
            status: "ASSIGNED",
            updated_at: now,
          })
          .eq("id", task.id);

        // b) Insert Task Assignment
        await supabase.from("task_assignments").insert({
          task_id: task.id,
          agent_id: selectedAgent.id,
          role: "PRIMARY",
          assigned_at: now,
        });

        // c) Update Agent Status to WORKING
        await supabase
          .from("agents")
          .update({
            status: "WORKING",
            current_task: task.title,
            last_run: now,
            updated_at: now,
          })
          .eq("id", selectedAgent.id);

        // d) Create Timeline Events
        await supabase.from("task_events").insert([
          {
            task_id: task.id,
            agent_id: selectedAgent.id,
            event_type: "MANAGER_PICKED",
            message: `Manager Runtime picked task '${task.title}'.`,
            details: { priority: task.priority },
          },
          {
            task_id: task.id,
            agent_id: selectedAgent.id,
            event_type: "ROLE_MATCHED",
            message: `Matched ${selectedAgent.name} (${selectedAgent.role}).`,
            details: { agent_id: selectedAgent.id, role: selectedAgent.role },
          },
          {
            task_id: task.id,
            agent_id: selectedAgent.id,
            event_type: "ASSIGNED",
            message: `Assigned successfully to ${selectedAgent.name}.`,
          },
        ]);

        // e) Log Agent Activity
        await supabase.from("agent_logs").insert({
          agent_id: selectedAgent.id,
          level: "INFO",
          event_type: "TASK_ASSIGNED",
          message: `Manager Runtime assigned task '${task.title}'.`,
          details: { task_id: task.id, priority: task.priority },
        });

        matches.push({
          taskId: task.id,
          taskTitle: task.title,
          agentId: selectedAgent.id,
          agentName: selectedAgent.name,
          agentRole: selectedAgent.role,
        });

        // Remove assigned agent from available pool for this tick
        availableAgents = availableAgents.filter((a) => a.id !== selectedAgent.id);
      } catch (err) {
        console.error(`[MANAGER RUNTIME ASSIGNMENT ERROR] Task ID ${task.id}:`, err);
      }
    }

    const remainingQueuedCount = unassignedTasks.length - matches.length;

    // Automatically trigger Execution Engine tick for newly assigned tasks
    if (matches.length > 0) {
      try {
        await runExecutionEngineTick();
      } catch (execErr) {
        console.error("[EXECUTION ENGINE AUTOMATIC TICK ERROR]:", execErr);
      }
    }

    return {
      processedTasks: unassignedTasks.length,
      matchedCount: matches.length,
      remainingQueuedCount,
      matches,
    };
  } catch (err) {
    console.error("[MANAGER RUNTIME TICK EXCEPTION]:", err);
    return { processedTasks: 0, matchedCount: 0, remainingQueuedCount: 0, matches: [] };
  }
}

/**
 * Returns Manager Runtime status summary for monitoring dashboards.
 */
export async function getManagerRuntimeStatus(): Promise<{
  queuedTasksCount: number;
  assignedTasksCount: number;
  runningTasksCount: number;
  idleAgentsCount: number;
  workingAgentsCount: number;
}> {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") {
      return {
        queuedTasksCount: 0,
        assignedTasksCount: 0,
        runningTasksCount: 0,
        idleAgentsCount: 0,
        workingAgentsCount: 0,
      };
    }

    const [tasksRes, agentsRes] = await Promise.allSettled([
      supabase.from("tasks").select("status"),
      supabase.from("agents").select("status"),
    ]);

    const tasks = tasksRes.status === "fulfilled" && !tasksRes.value.error ? tasksRes.value.data : [];
    const agents = agentsRes.status === "fulfilled" && !agentsRes.value.error ? agentsRes.value.data : [];

    const queuedTasksCount = tasks.filter((t: { status: string }) => ["CREATED", "QUEUED"].includes(t.status)).length;
    const assignedTasksCount = tasks.filter((t: { status: string }) => t.status === "ASSIGNED").length;
    const runningTasksCount = tasks.filter((t: { status: string }) => t.status === "RUNNING").length;

    const idleAgentsCount = agents.filter((a: { status: string }) => a.status === "IDLE").length;
    const workingAgentsCount = agents.filter((a: { status: string }) => a.status === "WORKING").length;

    return {
      queuedTasksCount,
      assignedTasksCount,
      runningTasksCount,
      idleAgentsCount,
      workingAgentsCount,
    };
  } catch (err) {
    console.error("[GET MANAGER RUNTIME STATUS EXCEPTION]:", err);
    return {
      queuedTasksCount: 0,
      assignedTasksCount: 0,
      runningTasksCount: 0,
      idleAgentsCount: 0,
      workingAgentsCount: 0,
    };
  }
}
