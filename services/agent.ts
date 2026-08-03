"use server";

/**
 * services/agent.ts
 *
 * Agent Runtime Foundation Service Layer.
 * Manages agent lifecycles, tools, memory scopes (private/shared), runs, and logs.
 * Read/write queries are wrapped in fault-tolerant handlers to prevent crashes if tables are missing.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { DEFAULT_AGENTS_SEED } from "@/types/agent";
import type {
  AgentRow,
  AgentToolRow,
  AgentMemoryRow,
  AgentRunRow,
  AgentLogRow,
  FullAgentDetails,
  AgentStatus,
  AgentMemoryScope,
  CreateAgentPayload,
} from "@/types/agent";

/**
 * Fetches all agents for the current user.
 * Returns empty array [] gracefully if table doesn't exist or is empty.
 * Does NOT auto-insert demo data unless explicitly requested via seedDefaultAgentsService().
 */
export async function getAgentsService(): Promise<AgentRow[]> {
  try {
    const { supabase, user } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") return [];

    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .or(`owner_id.eq.${user.id},owner_id.is.null`)
      .order("created_at", { ascending: true });

    if (error) {
      // Table missing or schema error — return empty array gracefully
      return [];
    }

    return (data || []) as AgentRow[];
  } catch (err) {
    console.error("[GET AGENTS EXCEPTION]:", err);
    return [];
  }
}

/**
 * Explicitly creates a single custom agent.
 */
export async function createAgentService(payload: CreateAgentPayload): Promise<AgentRow> {
  const { supabase, user } = await getServerContext();

  const { data, error } = await supabase
    .from("agents")
    .insert({
      owner_id: user.id,
      name: payload.name,
      role: payload.role,
      description: payload.description ?? null,
      status: "IDLE" as AgentStatus,
      model: payload.model ?? "gpt-4o",
      memory_scope: payload.memory_scope ?? "private",
      connected_integrations: payload.connected_integrations ?? ["Aura & Soul"],
      enabled_tools: payload.enabled_tools ?? ["Database", "Products"],
      current_task: "Idle — Ready for task assignment",
      last_run: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(`Create Agent Error: ${error.message}`);
  return data as AgentRow;
}

/**
 * Explicitly seeds the default 7 agents ONLY when requested by user.
 */
export async function seedDefaultAgentsService(): Promise<AgentRow[]> {
  const { supabase, user } = await getServerContext();

  const seedRows = DEFAULT_AGENTS_SEED.map((seed) => ({
    owner_id: user.id,
    name: seed.name,
    role: seed.role,
    description: seed.description,
    status: "IDLE" as AgentStatus,
    model: seed.model,
    memory_scope: seed.memory_scope,
    connected_integrations: seed.connected_integrations,
    enabled_tools: seed.enabled_tools,
    current_task: seed.current_task,
    last_run: new Date().toISOString(),
  }));

  const { data: created, error } = await supabase
    .from("agents")
    .insert(seedRows)
    .select("*");

  if (error) throw new Error(`Seed Default Agents Error: ${error.message}`);
  return (created || []) as AgentRow[];
}

/**
 * Fetches full agent details (agent, tools, memory, runs, logs).
 * Uses Promise.allSettled so missing sub-tables will not crash the page.
 */
export async function getFullAgentDetailsByIdService(agentId: string): Promise<FullAgentDetails | null> {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") return null;

    const { data: agent, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (error || !agent) return null;

    const [toolsRes, memoryRes, runsRes, logsRes] = await Promise.allSettled([
      supabase.from("agent_tools").select("*").eq("agent_id", agentId).order("created_at"),
      supabase.from("agent_memory").select("*").or(`agent_id.eq.${agentId},scope.eq.shared`).order("created_at", { ascending: false }),
      supabase.from("agent_runs").select("*").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(20),
      supabase.from("agent_logs").select("*").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(50),
    ]);

    const tools = toolsRes.status === "fulfilled" && !toolsRes.value.error ? toolsRes.value.data : [];
    const memory = memoryRes.status === "fulfilled" && !memoryRes.value.error ? memoryRes.value.data : [];
    const runs = runsRes.status === "fulfilled" && !runsRes.value.error ? runsRes.value.data : [];
    const logs = logsRes.status === "fulfilled" && !logsRes.value.error ? logsRes.value.data : [];

    return {
      agent: agent as AgentRow,
      tools: (tools || []) as AgentToolRow[],
      memory: (memory || []) as AgentMemoryRow[],
      runs: (runs || []) as AgentRunRow[],
      logs: (logs || []) as AgentLogRow[],
    };
  } catch (err) {
    console.error("[GET FULL AGENT DETAILS ERROR]:", err);
    return null;
  }
}

/**
 * RUNTIME CONTROL: runAgent(agentId)
 * Updates agent status to 'WORKING', creates a new agent_runs entry, and logs an agent_logs event.
 */
export async function runAgentService(agentId: string, taskOverride?: string): Promise<AgentRow> {
  const { supabase } = await getServerContext();

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("agents")
    .update({
      status: "WORKING",
      last_run: now,
      current_task: taskOverride || "Executing assigned operational task...",
      updated_at: now,
    })
    .eq("id", agentId)
    .select("*")
    .single();

  if (error) throw new Error(`Run Agent Error: ${error.message}`);

  // Create run entry
  try {
    const { data: run } = await supabase
      .from("agent_runs")
      .insert({
        agent_id: agentId,
        prompt: taskOverride || "Operational execution triggered",
        status: "RUNNING",
        started_at: now,
      })
      .select("id")
      .single();

    // Create log entry
    await supabase.from("agent_logs").insert({
      agent_id: agentId,
      run_id: run ? run.id : null,
      level: "INFO",
      event_type: "STARTED",
      message: `Agent '${updated.name}' started execution task.`,
      details: { task: taskOverride || "Operational execution triggered" },
    });
  } catch {
    // Graceful fallback if agent_runs / agent_logs tables not created yet
  }

  return updated as AgentRow;
}

/**
 * RUNTIME CONTROL: pauseAgent(agentId)
 */
export async function pauseAgentService(agentId: string): Promise<AgentRow> {
  const { supabase } = await getServerContext();

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("agents")
    .update({
      status: "PAUSED",
      updated_at: now,
    })
    .eq("id", agentId)
    .select("*")
    .single();

  if (error) throw new Error(`Pause Agent Error: ${error.message}`);

  try {
    await supabase.from("agent_logs").insert({
      agent_id: agentId,
      level: "WARN",
      event_type: "PAUSED",
      message: `Agent '${updated.name}' runtime paused by user.`,
    });
  } catch {
    // Ignore
  }

  return updated as AgentRow;
}

/**
 * RUNTIME CONTROL: resumeAgent(agentId)
 */
export async function resumeAgentService(agentId: string): Promise<AgentRow> {
  const { supabase } = await getServerContext();

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("agents")
    .update({
      status: "IDLE",
      updated_at: now,
    })
    .eq("id", agentId)
    .select("*")
    .single();

  if (error) throw new Error(`Resume Agent Error: ${error.message}`);

  try {
    await supabase.from("agent_logs").insert({
      agent_id: agentId,
      level: "INFO",
      event_type: "WAITING",
      message: `Agent '${updated.name}' resumed to IDLE state.`,
    });
  } catch {
    // Ignore
  }

  return updated as AgentRow;
}

/**
 * Tool Attachment API: Attaches/enables a pluggable tool on an agent.
 */
export async function toggleAgentToolService(agentId: string, toolName: string, enable: boolean): Promise<void> {
  const { supabase } = await getServerContext();

  const { data: agent } = await supabase.from("agents").select("*").eq("id", agentId).single();
  if (!agent) return;

  const currentTools: string[] = agent.enabled_tools || [];
  let updatedTools: string[];

  if (enable) {
    updatedTools = Array.from(new Set([...currentTools, toolName]));
  } else {
    updatedTools = currentTools.filter((t) => t !== toolName);
  }

  await supabase.from("agents").update({ enabled_tools: updatedTools, updated_at: new Date().toISOString() }).eq("id", agentId);

  try {
    if (enable) {
      const { data: existingTool } = await supabase
        .from("agent_tools")
        .select("*")
        .eq("agent_id", agentId)
        .eq("tool_name", toolName)
        .maybeSingle();

      if (existingTool) {
        await supabase.from("agent_tools").update({ is_enabled: true }).eq("id", existingTool.id);
      } else {
        await supabase.from("agent_tools").insert({
          agent_id: agentId,
          tool_name: toolName,
          tool_type: "pluggable",
          config: {},
          is_enabled: true,
        });
      }
    } else {
      await supabase.from("agent_tools").update({ is_enabled: false }).eq("agent_id", agentId).eq("tool_name", toolName);
    }
  } catch {
    // Ignore if agent_tools table missing
  }
}

/**
 * Memory API: Write key-value pair to agent memory (private or shared scope).
 */
export async function writeAgentMemoryService(
  agentId: string | null,
  scope: AgentMemoryScope,
  key: string,
  value: Record<string, unknown> | string | number | boolean
): Promise<AgentMemoryRow> {
  const { supabase, user } = await getServerContext();

  const { data, error } = await supabase
    .from("agent_memory")
    .insert({
      owner_id: user.id,
      agent_id: scope === "private" ? agentId : null,
      scope,
      key,
      value: typeof value === "object" ? value : { data: value },
    })
    .select("*")
    .single();

  if (error) throw new Error(`Write Agent Memory Error: ${error.message}`);
  return data as AgentMemoryRow;
}
