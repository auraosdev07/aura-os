"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  Play,
  Pause,
  RotateCcw,
  Wrench,
  Database,
  Clock,
  Radio,
  Cpu,
  ChevronRight,
  Plus,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  runAgentService,
  pauseAgentService,
  resumeAgentService,
  createAgentService,
  seedDefaultAgentsService,
} from "@/services/agent";
import type { AgentRow, AgentStatus, AgentMemoryScope } from "@/types/agent";

interface AgentsListFeatureProps {
  initialAgents: AgentRow[];
}

function getStatusBadge(status: AgentStatus) {
  switch (status) {
    case "WORKING":
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
          <span>WORKING</span>
        </span>
      );
    case "PAUSED":
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Pause className="w-3 h-3 text-amber-400" />
          <span>PAUSED</span>
        </span>
      );
    case "ERROR":
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          <span>ERROR</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>IDLE</span>
        </span>
      );
  }
}

export function AgentsListFeature({ initialAgents }: AgentsListFeatureProps) {
  const [agents, setAgents] = useState<AgentRow[]>(initialAgents);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal State for Create Agent
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [memoryScope, setMemoryScope] = useState<AgentMemoryScope>("private");
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const filteredAgents = agents.filter((a) => {
    if (statusFilter === "ALL") return true;
    return a.status === statusFilter;
  });

  const handleRun = async (agentId: string) => {
    setActionLoadingId(agentId);
    try {
      const updated = await runAgentService(agentId);
      setAgents((prev) => prev.map((a) => (a.id === agentId ? updated : a)));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePause = async (agentId: string) => {
    setActionLoadingId(agentId);
    try {
      const updated = await pauseAgentService(agentId);
      setAgents((prev) => prev.map((a) => (a.id === agentId ? updated : a)));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResume = async (agentId: string) => {
    setActionLoadingId(agentId);
    try {
      const updated = await resumeAgentService(agentId);
      setAgents((prev) => prev.map((a) => (a.id === agentId ? updated : a)));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
    setCreating(true);
    try {
      const newAgent = await createAgentService({
        name: name.trim(),
        role: role.trim(),
        description: description.trim() || undefined,
        model,
        memory_scope: memoryScope,
      });
      setAgents((prev) => [...prev, newAgent]);
      setName("");
      setRole("");
      setDescription("");
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const seeded = await seedDefaultAgentsService();
      setAgents(seeded);
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Bot className="w-7 h-7 text-emerald-400" /> Agent Runtime Foundation
            </h1>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Cpu className="w-3.5 h-3.5" />
              <span>{agents.length} AGENTS READY</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous AI agent orchestration, pluggable tool attachments, memory scopes, and execution controls.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {agents.length > 0 && (
            <div className="hidden sm:flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              {["ALL", "IDLE", "WORKING", "PAUSED", "ERROR"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    statusFilter === st
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 text-xs px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Agent
          </button>
        </div>
      </div>

      {/* Empty State when Agents length is 0 */}
      {agents.length === 0 ? (
        <div className="p-12 border border-slate-800 rounded-2xl bg-slate-900/50 flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 shadow-xl">
            <Bot className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">No Agents Yet</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              No active agents found in the connected database. Create a custom agent or initialize the standard 7 default operational agents.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 text-xs px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Create Agent
            </button>

            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="inline-flex items-center gap-2 text-xs px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{seeding ? "Initializing..." : "Seed Default 7 Agents"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Agents Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map((agent) => {
            const isLoading = actionLoadingId === agent.id;

            return (
              <div
                key={agent.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-5 group"
              >
                {/* Top Card Bar */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 font-bold group-hover:border-emerald-500/40 transition-colors">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-100 leading-tight">
                          {agent.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">{agent.role}</p>
                      </div>
                    </div>

                    {getStatusBadge(agent.status)}
                  </div>

                  {agent.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {agent.description}
                    </p>
                  )}
                </div>

                {/* Current Task & Telemetry */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-400">Current Task</span>
                    <span className="font-mono">{agent.model}</span>
                  </div>
                  <p className="text-slate-300 font-mono text-[11px] line-clamp-1">
                    {agent.current_task || "Idle — Waiting for next mission command"}
                  </p>
                </div>

                {/* Attributes Row */}
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono border-t border-slate-800/60 pt-3 text-slate-400">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">
                      Tools
                    </span>
                    <span className="font-bold text-slate-200 flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-amber-400" />
                      {agent.enabled_tools?.length ?? 0}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">
                      Memory
                    </span>
                    <span className="font-bold text-slate-200 capitalize flex items-center gap-1">
                      <Database className="w-3 h-3 text-blue-400" />
                      {agent.memory_scope}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">
                      Last Run
                    </span>
                    <span className="text-slate-300 truncate block">
                      {agent.last_run
                        ? new Date(agent.last_run).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Never"}
                    </span>
                  </div>
                </div>

                {/* Action Controls & Link */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    {agent.status === "WORKING" ? (
                      <button
                        onClick={() => handlePause(agent.id)}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs rounded-xl border border-amber-500/30 transition-colors flex items-center space-x-1"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </button>
                    ) : agent.status === "PAUSED" ? (
                      <button
                        onClick={() => handleResume(agent.id)}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/30 transition-colors flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRun(agent.id)}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Run Agent</span>
                      </button>
                    )}
                  </div>

                  <Link
                    href={`/agents/${agent.id}`}
                    className="text-xs text-slate-400 hover:text-emerald-400 font-semibold flex items-center space-x-1 transition-colors"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Agent */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAgent}
            className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl"
          >
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" /> Create Custom Agent
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Agent Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sales Specialist Agent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Role Title *</label>
                <input
                  type="text"
                  placeholder="e.g. B2B Sales & Lead Qualification Specialist"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe operational responsibilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">LLM Model</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Memory Scope</label>
                  <select
                    value={memoryScope}
                    onChange={(e) => setMemoryScope(e.target.value as AgentMemoryScope)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="private">Private</option>
                    <option value="shared">Shared</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-xs px-4 py-2 text-slate-400 hover:text-slate-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="text-xs px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20"
              >
                {creating ? "Creating..." : "Create Agent"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
