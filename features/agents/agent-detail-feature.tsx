"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Play,
  Pause,
  RotateCcw,
  Cpu,
  Wrench,
  Database,
  Plug,
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  CheckSquare,
  Search,
  Trash2,
  GitFork,
  MessageSquare,
} from "lucide-react";
import { AcpMessagesTab } from "@/features/acp/acp-messages-tab";
import {
  runAgentService,
  pauseAgentService,
  resumeAgentService,
  toggleAgentToolService,
  writeAgentMemoryService,
} from "@/services/agent";
import { deleteMemory } from "@/services/memory";
import { listTools } from "@/services/tools/tool-registry";
import type {
  FullAgentDetails,
  AgentStatus,
  AgentMemoryScope,
  AgentRow,
} from "@/types/agent";
import type { TaskRow, TaskEventRow } from "@/types/task";

interface AgentDetailFeatureProps {
  initialDetails: FullAgentDetails;
  agentTasks?: {
    active: TaskRow[];
    completed: TaskRow[];
    failed: TaskRow[];
    events: TaskEventRow[];
  };
  allAgents?: AgentRow[];
}

type TabType = "overview" | "tasks" | "tools" | "integrations" | "memory" | "runs" | "activity" | "messages";

function getStatusBadge(status: AgentStatus) {
  switch (status) {
    case "WORKING":
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          <span>WORKING</span>
        </span>
      );
    case "PAUSED":
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Pause className="w-3.5 h-3.5 text-amber-400" />
          <span>PAUSED</span>
        </span>
      );
    case "ERROR":
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>ERROR</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>IDLE</span>
        </span>
      );
  }
}

function getEventBadge(eventType: string) {
  switch (eventType.toUpperCase()) {
    case "STARTED":
    case "RUNNING":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          {eventType}
        </span>
      );
    case "FINISHED":
    case "COMPLETED":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
          {eventType}
        </span>
      );
    case "PAUSED":
    case "WARN":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          {eventType}
        </span>
      );
    case "FAILED":
    case "ERROR":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          {eventType}
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
          {eventType}
        </span>
      );
  }
}

export function AgentDetailFeature({
  initialDetails,
  agentTasks,
  allAgents = [],
}: AgentDetailFeatureProps) {
  const [details, setDetails] = useState<FullAgentDetails>(initialDetails);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(false);

  // New Memory Modal & Search/Filter State
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [memKey, setMemKey] = useState("");
  const [memVal, setMemVal] = useState("");
  const [memScope, setMemScope] = useState<AgentMemoryScope>("private");
  const [savingMemory, setSavingMemory] = useState(false);
  const [memSearch, setMemSearch] = useState("");
  const [memFilterScope, setMemFilterScope] = useState<"ALL" | "private" | "shared">("ALL");

  // Tools Search & Category Filter State
  const [toolSearch, setToolSearch] = useState("");
  const [toolCategoryFilter, setToolCategoryFilter] = useState("ALL");

  const agent = details.agent;
  const memoryList = details.memory || [];
  const runsList = details.runs || [];
  const logsList = details.logs || [];

  const filteredAgentMemories = memoryList.filter((m) => {
    if (memFilterScope !== "ALL" && m.scope !== memFilterScope) return false;
    if (memSearch.trim()) {
      const q = memSearch.toLowerCase();
      const matchKey = m.key.toLowerCase().includes(q);
      const matchVal = JSON.stringify(m.value).toLowerCase().includes(q);
      if (!matchKey && !matchVal) return false;
    }
    return true;
  });

  const activeTasks = agentTasks?.active || [];
  const completedTasks = agentTasks?.completed || [];
  const failedTasks = agentTasks?.failed || [];
  const taskEvents = agentTasks?.events || [];
  const totalTasks = activeTasks.length + completedTasks.length + failedTasks.length;

  const handleRun = async () => {
    setLoading(true);
    try {
      const updated = await runAgentService(agent.id);
      setDetails((prev) => ({ ...prev, agent: updated }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      const updated = await pauseAgentService(agent.id);
      setDetails((prev) => ({ ...prev, agent: updated }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      const updated = await resumeAgentService(agent.id);
      setDetails((prev) => ({ ...prev, agent: updated }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTool = async (toolName: string, enable: boolean) => {
    await toggleAgentToolService(agent.id, toolName, enable);
    setDetails((prev) => {
      const current = prev.agent.enabled_tools || [];
      const updated = enable
        ? Array.from(new Set([...current, toolName]))
        : current.filter((t) => t !== toolName);
      return {
        ...prev,
        agent: { ...prev.agent, enabled_tools: updated },
      };
    });
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memKey.trim()) return;
    setSavingMemory(true);
    try {
      const newMem = await writeAgentMemoryService(agent.id, memScope, memKey.trim(), memVal.trim());
      setDetails((prev) => ({
        ...prev,
        memory: [newMem, ...prev.memory],
      }));
      setMemKey("");
      setMemVal("");
      setShowMemoryModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingMemory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/agents"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Agents Workspace</span>
        </Link>
      </div>

      {/* Hero Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 font-bold shadow-xl">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-100">{agent.name}</h1>
                {getStatusBadge(agent.status)}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">{agent.role}</p>
            </div>
          </div>

          {/* Runtime Controls */}
          <div className="flex items-center space-x-3">
            {agent.status === "WORKING" ? (
              <button
                onClick={handlePause}
                disabled={loading}
                className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs rounded-xl border border-amber-500/30 transition-colors flex items-center space-x-2"
              >
                <Pause className="w-4 h-4" />
                <span>Pause Runtime</span>
              </button>
            ) : agent.status === "PAUSED" ? (
              <button
                onClick={handleResume}
                disabled={loading}
                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/30 transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Resume Runtime</span>
              </button>
            ) : (
              <button
                onClick={handleRun}
                disabled={loading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Run Agent Now</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
          {[
            { id: "overview", label: "Overview", icon: Cpu },
            { id: "tasks", label: `Assigned Tasks (${totalTasks})`, icon: CheckSquare },
            { id: "tools", label: `Tools (${agent.enabled_tools?.length ?? 0})`, icon: Wrench },
            { id: "integrations", label: `Integrations (${agent.connected_integrations?.length ?? 0})`, icon: Plug },
            { id: "memory", label: `Memory (${memoryList.length})`, icon: Database },
            { id: "runs", label: `Runs (${runsList.length})`, icon: Radio },
            { id: "messages", label: "Messages / ACP", icon: MessageSquare },
            { id: "activity", label: `Activity Logs (${logsList.length})`, icon: Clock },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as TabType)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-extrabold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT */}

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Operational Task & Role Definition
              </h2>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block uppercase font-semibold">Description</span>
                  <p className="text-slate-300 leading-relaxed mt-0.5">{agent.description || "No description provided."}</p>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-semibold">Current Active Task</span>
                  <p className="text-emerald-300 font-mono mt-0.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                    {agent.current_task || "Idle — Standing by for operational tasks"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-3">
                Runtime Specs
              </h2>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">LLM Model:</span>
                  <span className="font-bold text-slate-200">{agent.model}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Memory Scope:</span>
                  <span className="font-bold text-slate-200 capitalize">{agent.memory_scope}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Last Execution:</span>
                  <span className="text-slate-300">
                    {agent.last_run ? new Date(agent.last_run).toLocaleString() : "Never"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Created:</span>
                  <span className="text-slate-400">{new Date(agent.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Assigned Tasks Integration */}
      {activeTab === "tasks" && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" /> Assigned Operational Tasks
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Active, completed, and failed tasks orchestrated for this AI agent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Active Tasks */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase">Active Tasks</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                  {activeTasks.length}
                </span>
              </div>
              {activeTasks.length === 0 ? (
                <p className="text-xs text-slate-600 font-mono py-2">No active tasks</p>
              ) : (
                <div className="space-y-2">
                  {activeTasks.map((t) => (
                    <div key={t.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1 text-xs">
                      <span className="font-bold text-slate-200 block truncate">{t.title}</span>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>{t.status}</span>
                        <span>{t.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Tasks */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-purple-400 uppercase">Completed Tasks</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded">
                  {completedTasks.length}
                </span>
              </div>
              {completedTasks.length === 0 ? (
                <p className="text-xs text-slate-600 font-mono py-2">No completed tasks</p>
              ) : (
                <div className="space-y-2">
                  {completedTasks.map((t) => (
                    <div key={t.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1 text-xs">
                      <span className="font-bold text-slate-200 block truncate">{t.title}</span>
                      <span className="text-[10px] text-purple-400 block font-mono">100% Done</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Failed Tasks */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-rose-400 uppercase">Failed Tasks</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded">
                  {failedTasks.length}
                </span>
              </div>
              {failedTasks.length === 0 ? (
                <p className="text-xs text-slate-600 font-mono py-2">No failed tasks</p>
              ) : (
                <div className="space-y-2">
                  {failedTasks.map((t) => (
                    <div key={t.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1 text-xs">
                      <span className="font-bold text-rose-300 block truncate">{t.title}</span>
                      <span className="text-[10px] text-rose-400 block font-mono">Failed</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subtask Delegations Summary */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <GitFork className="w-4 h-4 text-purple-400" /> Multi-Agent Subtask Delegations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Delegated Tasks */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200">Tasks Delegated To Others</span>
                  <span className="text-[10px] font-mono text-purple-400 font-bold px-2 py-0.5 bg-purple-500/10 rounded border border-purple-500/30">
                    DELEGATOR ROLE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Subtasks spawned by {agent.name} to delegate workload across specialized agent runtimes.
                </p>
              </div>

              {/* Received Subtasks */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200">Subtasks Assigned To This Agent</span>
                  <span className="text-[10px] font-mono text-blue-400 font-bold px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/30">
                    EXECUTOR ROLE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Subtasks assigned to {agent.name} from other orchestrating agents.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Task Events */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase">Recent Task Events</span>
            {taskEvents.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">No recent task events for this agent.</p>
            ) : (
              <div className="space-y-2 text-xs font-mono">
                {taskEvents.map((ev) => (
                  <div key={ev.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center">
                    <span className="text-slate-200 font-sans">{ev.message}</span>
                    <span className="text-[10px] text-slate-500">{new Date(ev.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Pluggable Tools */}
      {activeTab === "tools" && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" /> Pluggable Tool Architecture & Assignment
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Attach or detach tools dynamically. Every attached tool is exposed to the AI execution runtime.
              </p>
            </div>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tools by name or description..."
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Category:</span>
              <select
                value={toolCategoryFilter}
                onChange={(e) => setToolCategoryFilter(e.target.value)}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono"
              >
                <option value="ALL">All Categories</option>
                <option value="System">System</option>
                <option value="Database">Database</option>
                <option value="Search">Search</option>
                <option value="Content">Content</option>
                <option value="Commerce">Commerce</option>
                <option value="Communication">Communication</option>
              </select>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listTools()
              .filter((tool) => {
                if (toolCategoryFilter !== "ALL" && tool.category !== toolCategoryFilter) return false;
                if (toolSearch.trim()) {
                  const q = toolSearch.toLowerCase();
                  const matchName = tool.name.toLowerCase().includes(q);
                  const matchDesc = tool.description.toLowerCase().includes(q);
                  if (!matchName && !matchDesc) return false;
                }
                return true;
              })
              .map((tool) => {
                const isEnabled = (agent.enabled_tools || []).includes(tool.name);

                return (
                  <div
                    key={tool.id}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                      isEnabled
                        ? "bg-slate-950 border-emerald-500/40"
                        : "bg-slate-950/40 border-slate-800 opacity-60"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-100">{tool.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-amber-400 font-mono rounded uppercase">
                          {tool.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{tool.description}</p>
                    </div>

                    <button
                      onClick={() => handleToggleTool(tool.name, !isEnabled)}
                      className={`text-xs px-3 py-1.5 font-bold rounded-xl border transition-colors shrink-0 ${
                        isEnabled
                          ? "bg-emerald-500/10 hover:bg-rose-500/10 text-emerald-400 hover:text-rose-400 border-emerald-500/30 hover:border-rose-500/30"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {isEnabled ? "Attached" : "Attach"}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tab 4: Connected Integrations */}
      {activeTab === "integrations" && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Plug className="w-4 h-4 text-cyan-400" /> Connected Integrations
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              External platforms and databases accessible to this agent.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(agent.connected_integrations || []).map((integ) => (
              <div
                key={integ}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    {integ.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-100">{integ}</span>
                    <span className="text-[10px] text-emerald-400 block font-mono">Connected</span>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Memory */}
      {activeTab === "memory" && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" /> Agent Persistent Memory System
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Private Scope is agent-isolated. Shared Scope is accessible across all agents during task execution.
              </p>
            </div>

            <button
              onClick={() => setShowMemoryModal(true)}
              className="text-xs px-3.5 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Memory</span>
            </button>
          </div>

          {/* Search & Scope Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search memory key or payload..."
                value={memSearch}
                onChange={(e) => setMemSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Scope:</span>
              <select
                value={memFilterScope}
                onChange={(e) => setMemFilterScope(e.target.value as "ALL" | "private" | "shared")}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono"
              >
                <option value="ALL">All Scopes</option>
                <option value="private">Private Only</option>
                <option value="shared">Shared Only</option>
              </select>
            </div>
          </div>

          {/* Memory List */}
          {filteredAgentMemories.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-slate-800 rounded-xl">
              No memory entries match active search or scope criteria. Click &quot;Add Memory&quot; to save key-value pairs.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAgentMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs group hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-100 text-xs">{mem.key}</span>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                          mem.scope === "shared"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {mem.scope} scope
                      </span>
                      <button
                        onClick={async () => {
                          if (confirm("Delete this memory entry?")) {
                            await deleteMemory(mem.id);
                            setDetails((prev) => ({
                              ...prev,
                              memory: prev.memory.filter((m) => m.id !== mem.id),
                            }));
                          }
                        }}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Delete Memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800/60 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-36 leading-relaxed">
                    {typeof mem.value === "object" ? JSON.stringify(mem.value, null, 2) : String(mem.value)}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Memory Modal */}
          {showMemoryModal && (
            <form
              onSubmit={handleAddMemory}
              className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 max-w-md mx-auto"
            >
              <h3 className="text-sm font-bold text-slate-100">Write to Agent Memory</h3>

              <div className="space-y-2 text-xs">
                <label className="block text-slate-400 font-semibold">Scope</label>
                <select
                  value={memScope}
                  onChange={(e) => setMemScope(e.target.value as AgentMemoryScope)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono"
                >
                  <option value="private">Private (Only this agent)</option>
                  <option value="shared">Shared (Accessible across all agents)</option>
                </select>

                <label className="block text-slate-400 font-semibold pt-2">Memory Key *</label>
                <input
                  type="text"
                  placeholder="e.g. preferred_seo_style"
                  value={memKey}
                  onChange={(e) => setMemKey(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono"
                  required
                />

                <label className="block text-slate-400 font-semibold pt-2">Value Payload (Text or JSON) *</label>
                <textarea
                  rows={3}
                  placeholder='e.g. {"tone": "premium", "keywords": ["healing", "bracelet"]}'
                  value={memVal}
                  onChange={(e) => setMemVal(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono text-[11px]"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMemoryModal(false)}
                  className="text-xs px-3 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMemory}
                  className="text-xs px-4 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Memory
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 6: Agent Runs */}
      {activeTab === "runs" && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" /> Runtime Runs Execution Table
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Historical records of execution runs triggered for this agent.
            </p>
          </div>

          {runsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-slate-800 rounded-xl">
              No runtime runs recorded yet. Click &quot;Run Agent Now&quot; to execute a new run.
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {runsList.map((run) => {
                const stages: string[] = ["Planning", "Tool Calling", "Reasoning", "Writing", "Memory", "Completed"];

                return (
                  <div
                    key={run.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getEventBadge(run.status)}
                        <span className="text-slate-400 text-[11px]">
                          {new Date(run.created_at).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Duration: {run.duration_ms}ms
                      </span>
                    </div>

                    {/* Execution Engine v2 Stages Progress */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
                      {stages.map((st, idx) => (
                        <div key={st} className="flex items-center space-x-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            {st}
                          </span>
                          {idx < stages.length - 1 && (
                            <span className="text-slate-600 font-sans text-xs">→</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="text-slate-300 font-sans text-xs">
                      {run.prompt || "Execution run triggered."}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Activity Logs */}
      {activeTab === "activity" && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" /> Agent Activity & Audit Logs
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Low-level events logged during agent runtime execution.
            </p>
          </div>

          {logsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-slate-800 rounded-xl">
              No activity logs recorded yet.
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {logsList.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {getEventBadge(log.level || log.event_type)}
                      <span className="text-slate-400 text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-200 font-sans text-xs font-semibold">
                      {log.message}
                    </p>
                    {log.details && (
                      <pre className="text-slate-400 text-[11px] font-mono bg-slate-900 p-2 rounded overflow-x-auto">
                        {typeof log.details === "object"
                          ? JSON.stringify(log.details)
                          : String(log.details)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 8: Messages / ACP */}
      {activeTab === "messages" && (
        <AcpMessagesTab agentId={agent.id} allAgents={allAgents} />
      )}
    </div>
  );
}
