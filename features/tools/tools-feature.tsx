"use client";

import { useState } from "react";
import {
  Wrench,
  Search,
  CheckCircle2,
  Bot,
  Play,
  Layers,
  Shield,
  Clock,
} from "lucide-react";
import { listTools } from "@/services/tools/tool-registry";
import { runTool } from "@/services/tools/tool-runner";
import type { ToolCategory, ToolResult } from "@/services/tools/types";
import type { AgentRow } from "@/types/agent";

function formatToolOutputPayload(val: unknown): string {
  if (val === null || val === undefined) return "";
  let target = val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        target = JSON.parse(trimmed);
      } catch {
        return val;
      }
    } else {
      return val;
    }
  }
  try {
    return JSON.stringify(target, null, 2);
  } catch {
    return String(val);
  }
}

interface ToolsFeatureProps {
  agents: AgentRow[];
}

const CATEGORIES: ("ALL" | ToolCategory)[] = [
  "ALL",
  "System",
  "Database",
  "Search",
  "Content",
  "Image",
  "Commerce",
  "Communication",
];

export function ToolsFeature({ agents }: ToolsFeatureProps) {
  const tools = listTools();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | ToolCategory>("ALL");

  // Test Execution Modal State
  const [testingToolId, setTestingToolId] = useState<string | null>(null);
  const [testInputJson, setTestInputJson] = useState('{"query": "crystal"}');
  const [testAgentId, setTestAgentId] = useState<string>(agents[0]?.id || "");
  const [testResult, setTestResult] = useState<ToolResult | null>(null);
  const [running, setRunning] = useState(false);

  const filteredTools = tools.filter((tool) => {
    if (categoryFilter !== "ALL" && tool.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = tool.name.toLowerCase().includes(q);
      const matchDesc = tool.description.toLowerCase().includes(q);
      const matchId = tool.id.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchId) return false;
    }
    return true;
  });

  const handleTestRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testingToolId) return;
    setRunning(true);
    setTestResult(null);

    let parsedInput: Record<string, unknown> = {};
    try {
      parsedInput = JSON.parse(testInputJson);
    } catch {
      parsedInput = { query: testInputJson };
    }

    try {
      const res = await runTool(testingToolId, parsedInput, testAgentId || agents[0]?.id || "dev-agent");
      setTestResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      setTestResult({
        success: false,
        output: {},
        error: msg,
        executionTimeMs: 0,
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Wrench className="w-7 h-7 text-amber-400" /> Pluggable Tool Framework v1
            </h1>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Layers className="w-3.5 h-3.5" />
              <span>{tools.length} REGISTERED TOOLS</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Central registry of executable tools. Agents call these tools during operational task execution.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tools by name, description, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl font-mono text-[11px] transition-all whitespace-nowrap ${
                categoryFilter === cat
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => {
          // Find agents that have this tool enabled
          const assignedAgents = agents.filter((a) => (a.enabled_tools || []).includes(tool.name));

          return (
            <div
              key={tool.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                    {tool.category}
                  </span>
                  <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Enabled</span>
                  </span>
                </div>

                {/* Name & ID */}
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 group-hover:text-amber-400 transition-colors">
                    {tool.name}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 block">{tool.id}</span>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{tool.description}</p>
                </div>

                {/* Permissions */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                    <Shield className="w-3 h-3 text-cyan-400" /> Required Permissions
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {tool.permissions.map((p) => (
                      <span key={p} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Available Agents */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                    <Bot className="w-3 h-3 text-emerald-400" /> Attached to Agents ({assignedAgents.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {assignedAgents.length === 0 ? (
                      <span className="text-[10px] text-slate-600 font-mono">None attached</span>
                    ) : (
                      assignedAgents.map((a) => (
                        <span key={a.id} className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 truncate max-w-[120px]">
                          {a.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-slate-800/80 text-right">
                <button
                  onClick={() => {
                    setTestingToolId(tool.id);
                    setTestResult(null);
                  }}
                  className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs rounded-xl border border-amber-500/30 transition-colors inline-flex items-center space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Test Run Tool</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Test Execution Modal */}
      {testingToolId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleTestRun}
            className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Test Tool Execution</span>
                <h2 className="text-base font-bold text-slate-100 font-mono">{testingToolId}</h2>
              </div>
              <button
                type="button"
                onClick={() => setTestingToolId(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Execute as Agent</label>
                <select
                  value={testAgentId}
                  onChange={(e) => setTestAgentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Input Payload (JSON)</label>
                <textarea
                  rows={3}
                  value={testInputJson}
                  onChange={(e) => setTestInputJson(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-[11px]"
                />
              </div>

              {testResult && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className={`font-bold ${testResult.success ? "text-emerald-400" : "text-rose-400"}`}>
                      {testResult.success ? "EXECUTION SUCCESSFUL" : "EXECUTION FAILED"}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {testResult.executionTimeMs}ms
                    </span>
                  </div>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                    {formatToolOutputPayload(testResult.output)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTestingToolId(null)}
                className="text-xs px-4 py-2 text-slate-400 hover:text-slate-200"
              >
                Done
              </button>
              <button
                type="submit"
                disabled={running}
                className="text-xs px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{running ? "Executing..." : "Run Tool"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
