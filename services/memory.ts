"use server";

/**
 * services/memory.ts
 *
 * Aura OS Agent Memory System v1 Service Layer.
 * Manages creation, updating, deletion, searching, and retrieval of private and shared agent memories.
 * Fully database-driven without vector DB or LLM dependencies.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type { AgentMemoryRow, AgentMemoryScope, AgentRow } from "@/types/agent";

export interface MemoryWithAgent extends AgentMemoryRow {
  agent_name?: string | null;
}

/**
 * Creates a new memory entry for an agent or shared scope.
 */
export async function createMemory(
  agentId: string | null,
  key: string,
  value: Record<string, unknown> | string,
  scope: AgentMemoryScope = "private"
): Promise<AgentMemoryRow> {
  const { supabase, user } = await getServerContext();

  const formattedValue =
    typeof value === "string" ? { text: value } : value;

  const { data, error } = await supabase
    .from("agent_memory")
    .insert({
      owner_id: user.id,
      agent_id: scope === "shared" ? null : agentId,
      scope,
      key,
      value: formattedValue,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Create Memory Error: ${error.message}`);
  return data as AgentMemoryRow;
}

/**
 * Updates an existing memory value by ID.
 */
export async function updateMemory(
  id: string,
  value: Record<string, unknown> | string
): Promise<AgentMemoryRow> {
  const { supabase } = await getServerContext();

  const formattedValue =
    typeof value === "string" ? { text: value } : value;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("agent_memory")
    .update({
      value: formattedValue,
      updated_at: now,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`Update Memory Error: ${error.message}`);
  return data as AgentMemoryRow;
}

/**
 * Deletes a memory record by ID.
 */
export async function deleteMemory(id: string): Promise<void> {
  const { supabase } = await getServerContext();

  const { error } = await supabase.from("agent_memory").delete().eq("id", id);
  if (error) throw new Error(`Delete Memory Error: ${error.message}`);
}

/**
 * Retrieves memories for a specific agent (Private memories + Shared memories).
 */
export async function getMemory(agentId: string): Promise<AgentMemoryRow[]> {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") return [];

    const { data, error } = await supabase
      .from("agent_memory")
      .select("*")
      .or(`agent_id.eq.${agentId},scope.eq.shared`)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as AgentMemoryRow[];
  } catch (err) {
    console.error("[GET MEMORY EXCEPTION]:", err);
    return [];
  }
}

/**
 * Searches memories for an agent (or shared) by key or stringified JSON value.
 */
export async function searchMemory(
  agentId: string,
  query: string
): Promise<AgentMemoryRow[]> {
  try {
    const all = await getMemory(agentId);
    if (!query.trim()) return all;

    const q = query.toLowerCase();
    return all.filter((mem) => {
      const matchKey = mem.key.toLowerCase().includes(q);
      const matchVal = JSON.stringify(mem.value).toLowerCase().includes(q);
      return matchKey || matchVal;
    });
  } catch (err) {
    console.error("[SEARCH MEMORY EXCEPTION]:", err);
    return [];
  }
}

/**
 * Retrieves all shared memory entries accessible across all agents.
 */
export async function getSharedMemory(): Promise<AgentMemoryRow[]> {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") return [];

    const { data, error } = await supabase
      .from("agent_memory")
      .select("*")
      .eq("scope", "shared")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as AgentMemoryRow[];
  } catch (err) {
    console.error("[GET SHARED MEMORY EXCEPTION]:", err);
    return [];
  }
}

/**
 * Fetches all memories (Private & Shared) with owner agent details for the global /memory page.
 */
export async function getAllMemoriesWithAgents(): Promise<MemoryWithAgent[]> {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") return [];

    const [memRes, agentsRes] = await Promise.allSettled([
      supabase.from("agent_memory").select("*").order("created_at", { ascending: false }),
      supabase.from("agents").select("id, name"),
    ]);

    const memories =
      memRes.status === "fulfilled" && !memRes.value.error ? memRes.value.data : [];
    const agents =
      agentsRes.status === "fulfilled" && !agentsRes.value.error ? agentsRes.value.data : [];

    const agentMap: Record<string, string> = {};
    (agents || []).forEach((a: Partial<AgentRow>) => {
      if (a.id && a.name) agentMap[a.id] = a.name;
    });

    return (memories || []).map((m: AgentMemoryRow) => ({
      ...m,
      agent_name: m.agent_id ? agentMap[m.agent_id] || "Agent " + m.agent_id.substring(0, 6) : "Global / Shared",
    })) as MemoryWithAgent[];
  } catch (err) {
    console.error("[GET ALL MEMORIES EXCEPTION]:", err);
    return [];
  }
}
