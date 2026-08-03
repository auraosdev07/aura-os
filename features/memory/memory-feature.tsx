"use client";

import { useState, useCallback } from "react";
import {
  Database,
  Search,
  Plus,
  Trash2,
  Edit2,
  Globe,
  Lock,
  Bot,
  Layers,
} from "lucide-react";
import {
  createMemory,
  updateMemory,
  deleteMemory,
  getAllMemoriesWithAgents,
} from "@/services/memory";
import type { MemoryWithAgent } from "@/services/memory";
import type { AgentRow, AgentMemoryScope } from "@/types/agent";

interface MemoryFeatureProps {
  initialMemories: MemoryWithAgent[];
  agents: AgentRow[];
}

export function MemoryFeature({ initialMemories, agents }: MemoryFeatureProps) {
  const [memories, setMemories] = useState<MemoryWithAgent[]>(initialMemories);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"ALL" | "private" | "shared">("ALL");
  const [agentFilter, setAgentFilter] = useState<string>("ALL");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMem, setEditingMem] = useState<MemoryWithAgent | null>(null);

  // Form states
  const [key, setKey] = useState("");
  const [val, setVal] = useState("");
  const [scope, setScope] = useState<AgentMemoryScope>("private");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const refreshMemories = useCallback(async () => {
    try {
      const updated = await getAllMemoriesWithAgents();
      setMemories(updated);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !val.trim()) return;
    setSubmitting(true);
    try {
      let parsedVal: Record<string, unknown> | string = val.trim();
      try {
        parsedVal = JSON.parse(val.trim());
      } catch {
        // Keep as string if not JSON
      }

      await createMemory(
        scope === "shared" ? null : selectedAgentId || (agents[0]?.id ?? null),
        key.trim(),
        parsedVal,
        scope
      );

      setKey("");
      setVal("");
      setShowAddModal(false);
      await refreshMemories();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMem || !val.trim()) return;
    setSubmitting(true);
    try {
      let parsedVal: Record<string, unknown> | string = val.trim();
      try {
        parsedVal = JSON.parse(val.trim());
      } catch {
        // Keep as string
      }

      await updateMemory(editingMem.id, parsedVal);
      setEditingMem(null);
      setVal("");
      await refreshMemories();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this memory entry?")) return;
    try {
      await deleteMemory(id);
      await refreshMemories();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter memories
  const filteredMemories = memories.filter((mem) => {
    if (scopeFilter !== "ALL" && mem.scope !== scopeFilter) return false;
    if (agentFilter !== "ALL" && mem.agent_id !== agentFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchKey = mem.key.toLowerCase().includes(q);
      const matchVal = JSON.stringify(mem.value).toLowerCase().includes(q);
      const matchAgent = (mem.agent_name || "").toLowerCase().includes(q);
      if (!matchKey && !matchVal && !matchAgent) return false;
    }
    return true;
  });

  const privateCount = memories.filter((m) => m.scope === "private").length;
  const sharedCount = memories.filter((m) => m.scope === "shared").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Database className="w-7 h-7 text-blue-400" /> Agent Memory System v1
            </h1>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Layers className="w-3.5 h-3.5" />
              <span>{memories.length} MEMORY ENTRIES</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Long-term memory persistence across AI agent runtimes. Supports Private Scope (agent-isolated) and Shared Scope (cross-agent).
          </p>
        </div>

        <button
          onClick={() => {
            setKey("");
            setVal("");
            setScope("private");
            setSelectedAgentId(agents[0]?.id || "");
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 text-xs px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Memory
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Total Memories</span>
            <h3 className="text-xl font-extrabold text-slate-100">{memories.length}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Private Memories</span>
            <h3 className="text-xl font-extrabold text-emerald-400">{privateCount}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Shared Memories</span>
            <h3 className="text-xl font-extrabold text-purple-400">{sharedCount}</h3>
          </div>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search memory by key, value text, or agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-sans"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as "ALL" | "private" | "shared")}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono"
          >
            <option value="ALL">Scope: All</option>
            <option value="private">Private Scope</option>
            <option value="shared">Shared Scope</option>
          </select>

          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono max-w-[170px] truncate"
          >
            <option value="ALL">Agent: All</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Memory List / Cards Grid */}
      {filteredMemories.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Database className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Memory Entries Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No memories match the active search query or scope filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      mem.scope === "shared"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {mem.scope === "shared" ? (
                      <>
                        <Globe className="w-3 h-3" />
                        <span>SHARED SCOPE</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>PRIVATE SCOPE</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center space-x-1 font-mono text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <Bot className="w-3 h-3 text-blue-400" />
                    <span>{mem.agent_name || "Global"}</span>
                  </div>
                </div>

                {/* Key */}
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Memory Key</span>
                  <h3 className="text-sm font-extrabold font-mono text-slate-100 mt-0.5 group-hover:text-blue-400 transition-colors">
                    {mem.key}
                  </h3>
                </div>

                {/* Value */}
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Value Payload</span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-36 leading-relaxed">
                    {typeof mem.value === "object" ? JSON.stringify(mem.value, null, 2) : String(mem.value)}
                  </pre>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 font-mono text-[10px] text-slate-500">
                <span>{new Date(mem.updated_at || mem.created_at).toLocaleString()}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingMem(mem);
                      setVal(typeof mem.value === "object" ? JSON.stringify(mem.value, null, 2) : String(mem.value));
                    }}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors flex items-center space-x-1"
                    title="Edit Memory Value"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(mem.id)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 transition-colors flex items-center space-x-1"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" /> Create Memory Entry
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Memory Scope</label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as AgentMemoryScope)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                  >
                    <option value="private">Private (Agent Isolated)</option>
                    <option value="shared">Shared (Global Access)</option>
                  </select>
                </div>

                {scope === "private" && (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Owner Agent</label>
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                      required
                    >
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Memory Key *</label>
                <input
                  type="text"
                  placeholder="e.g. preferred_seo_style or target_audience_specs"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Value Payload (Text or JSON) *</label>
                <textarea
                  rows={4}
                  placeholder='e.g. {"tone": "premium", "keywords": ["healing", "bracelet"]}'
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-blue-500 text-[11px]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs px-4 py-2 text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="text-xs px-5 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-blue-500/20"
              >
                {submitting ? "Saving..." : "Save Memory"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Memory Modal */}
      {editingMem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdate}
            className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Edit Memory</span>
                <h2 className="text-base font-bold text-slate-100 font-mono">{editingMem.key}</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingMem(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Updated Value Payload (Text or JSON) *</label>
                <textarea
                  rows={6}
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-[11px]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingMem(null)}
                className="text-xs px-4 py-2 text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="text-xs px-5 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-blue-500/20"
              >
                {submitting ? "Updating..." : "Update Memory"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
