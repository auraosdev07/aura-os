"use client";

import { useState, useEffect } from "react";
import { GitFork, ArrowRight, Bot, CheckCircle2, Clock, Layers } from "lucide-react";
import { getAllTaskDependencies } from "@/services/task-delegation";
import type { TaskDependencyRow } from "@/types/task";

export function TaskDependencyGraphWidget() {
  const [dependencies, setDependencies] = useState<TaskDependencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "SATISFIED">("ALL");

  useEffect(() => {
    let active = true;
    getAllTaskDependencies().then((deps) => {
      if (active) {
        setDependencies(deps);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const filteredDeps = dependencies.filter((dep) => {
    if (statusFilter !== "ALL" && dep.status !== statusFilter) return false;
    return true;
  });

  const pendingCount = dependencies.filter((d) => d.status === "PENDING").length;
  const satisfiedCount = dependencies.filter((d) => d.status === "SATISFIED").length;

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <GitFork className="w-5 h-5 text-purple-400" /> Task Dependency Graph
            </h2>
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Layers className="w-3.5 h-3.5" />
              <span>{dependencies.length} DELEGATED SUBTASKS</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time visualization of parent-child subtask orchestration across autonomous agent runtimes.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "PENDING" | "SATISFIED")}
            className="p-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono"
          >
            <option value="ALL">All ({dependencies.length})</option>
            <option value="PENDING">Pending ({pendingCount})</option>
            <option value="SATISFIED">Satisfied ({satisfiedCount})</option>
          </select>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Total Delegations</span>
          <span className="text-base font-extrabold text-slate-100">{dependencies.length}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-amber-400">Awaiting Subtasks</span>
          <span className="text-base font-extrabold text-amber-400">{pendingCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-emerald-400">Satisfied Dependencies</span>
          <span className="text-base font-extrabold text-emerald-400">{satisfiedCount}</span>
        </div>
      </div>

      {/* Dependency Graph Tree / List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 font-mono">
          Loading task dependency graph...
        </div>
      ) : filteredDeps.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 border border-slate-800/80 rounded-xl space-y-2">
          <GitFork className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-bold text-slate-400">No Subtask Dependencies Found</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Open any running task in the Task Orchestrator and click &quot;Delegate Subtask&quot; to spawn agent-to-agent work.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeps.map((dep) => {
            const parent = dep.parent_task;
            const child = dep.child_task;
            const isSatisfied = dep.status === "SATISFIED";

            return (
              <div
                key={dep.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                {/* Node Top: Parent -> Child Relation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
                  {/* Parent Task Node */}
                  <div className="flex items-center space-x-2.5 p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-slate-500 uppercase block">Parent Task</span>
                      <span className="font-bold text-slate-200 truncate block">
                        {parent?.title || `Parent #${dep.parent_task_id.substring(0, 8)}`}
                      </span>
                    </div>
                  </div>

                  {/* Flow Arrow */}
                  <div className="flex items-center justify-center space-x-1 px-2 text-slate-500">
                    <ArrowRight className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-[9px] uppercase font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {dep.dependency_type}
                    </span>
                    <ArrowRight className="w-4 h-4 text-purple-400 shrink-0" />
                  </div>

                  {/* Child Subtask Node */}
                  <div className="flex items-center space-x-2.5 p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-slate-500 uppercase block">Child Subtask</span>
                      <span className="font-bold text-purple-200 truncate block">
                        {child?.title || `Subtask #${dep.child_task_id.substring(0, 8)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Metadata Badges */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-400">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Bot className="w-3.5 h-3.5 text-blue-400" />
                      <span>Delegator: {dep.agent?.name || "Orchestration Manager"}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Bot className="w-3.5 h-3.5 text-purple-400" />
                      <span>Executor: {child?.assigned_agent?.name || "Unassigned"}</span>
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      isSatisfied
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {isSatisfied ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span>{isSatisfied ? "DEPENDENCY SATISFIED" : "PENDING SUBTASK"}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
