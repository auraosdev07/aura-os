"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Play,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  GitFork,
  ArrowRight,
  Bot,
  Sparkles,
  Globe,
  Camera,
  Layers,
  Cpu,
} from "lucide-react";
import {
  getTaskById,
  assignTask,
  startTask,
  completeTask,
  failTask,
  cancelTask,
  addTaskArtifact,
  getMergedOutputForTask,
} from "@/services/task";
import { getTaskOutput } from "@/services/task-output";
import { createChildTask, getChildTasks } from "@/services/task-delegation";
import { decomposeTaskIntoSubtasks } from "@/services/multi-agent/planner";
import { delegateUnassignedSubtasks } from "@/services/multi-agent/delegation";
import type { TaskRow, FullTaskDetails, TaskDependencyRow, MergedOutputRow } from "@/types/task";
import type { AgentRow } from "@/types/agent";
import type { TaskOutputRow } from "@/types/task-output";

interface ToolExecutionRecordItem {
  id: string;
  tool_id: string;
  tool_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status: string;
  attempt_count: number;
  execution_time_ms: number;
  error_message: string | null;
  created_at: string;
}

function formatToolPayload(val: unknown): string {
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

interface TaskDrawerProps {
  task: TaskRow | null;
  agents: AgentRow[];
  onClose: () => void;
  onRefresh: () => void;
}

export function TaskDrawer({ task, agents, onClose, onRefresh }: TaskDrawerProps) {
  const [details, setDetails] = useState<FullTaskDetails | null>(null);
  const [childTasks, setChildTasks] = useState<TaskDependencyRow[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // New Artifact State
  const [showArtifactForm, setShowArtifactForm] = useState(false);
  const [artTitle, setArtTitle] = useState("");
  const [artType] = useState("document");
  const [artContent, setArtContent] = useState("");
  const [addingArtifact, setAddingArtifact] = useState(false);

  // New Subtask Modal State
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subTitle, setSubTitle] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [subAssignedAgentId, setSubAssignedAgentId] = useState("");
  const [subPriority, setSubPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "CRITICAL">("NORMAL");
  const [creatingSubtask, setCreatingSubtask] = useState(false);

  const [mergedOutput, setMergedOutput] = useState<MergedOutputRow | null>(null);
  const [taskOutput, setTaskOutput] = useState<TaskOutputRow | null>(null);
  const [toolExecutions, setToolExecutions] = useState<ToolExecutionRecordItem[]>([]);

  const reloadDetails = useCallback(async (taskId: string) => {
    try {
      const [full, subdeps, merged, outRow, toolRes] = await Promise.all([
        getTaskById(taskId),
        getChildTasks(taskId),
        getMergedOutputForTask(taskId),
        getTaskOutput(taskId),
        fetch(`/api/tools/executions?taskId=${taskId}`).then((res) => res.json()),
      ]);
      if (full) setDetails(full);
      setChildTasks(subdeps || []);
      setMergedOutput(merged);
      setTaskOutput(outRow);
      if (toolRes?.success) setToolExecutions(toolRes.executions || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!task) return;

    let active = true;

    Promise.all([
      getTaskById(task.id),
      getChildTasks(task.id),
      getMergedOutputForTask(task.id),
      getTaskOutput(task.id),
      fetch(`/api/tools/executions?taskId=${task.id}`).then((res) => res.json()),
    ]).then(([full, subdeps, merged, outRow, toolRes]) => {
      if (active) {
        if (full) setDetails(full);
        setChildTasks(subdeps || []);
        setMergedOutput(merged);
        setTaskOutput(outRow);
        if (toolRes?.success) setToolExecutions(toolRes.executions || []);
      }
    });

    return () => {
      active = false;
    };
  }, [task]);

  if (!task) return null;

  const currentTask = details?.task || task;
  const events = details?.events || [];
  const artifacts = details?.artifacts || [];

  const handleAssignAgent = async (agentId: string) => {
    if (!agentId) return;
    setActionLoading(true);
    try {
      await assignTask(currentTask.id, agentId);
      await reloadDetails(currentTask.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await startTask(currentTask.id);
      await reloadDetails(currentTask.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await completeTask(currentTask.id);
      await reloadDetails(currentTask.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFail = async () => {
    setActionLoading(true);
    try {
      await failTask(currentTask.id, "Manually marked as failed from UI");
      await reloadDetails(currentTask.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await cancelTask(currentTask.id);
      await reloadDetails(currentTask.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle.trim() || !artContent.trim()) return;
    setAddingArtifact(true);
    try {
      await addTaskArtifact(currentTask.id, artTitle.trim(), artType, artContent.trim());
      setArtTitle("");
      setArtContent("");
      setShowArtifactForm(false);
      await reloadDetails(currentTask.id);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingArtifact(false);
    }
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTitle.trim()) return;
    setCreatingSubtask(true);
    try {
      const creatorAgentId = currentTask.assigned_agent_id || agents[0]?.id || "";
      await createChildTask(
        currentTask.id,
        creatorAgentId,
        subTitle.trim(),
        subDesc.trim(),
        subAssignedAgentId || undefined,
        subPriority
      );
      setSubTitle("");
      setSubDesc("");
      setShowSubtaskForm(false);
      await reloadDetails(currentTask.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingSubtask(false);
    }
  };

  const handleAutoDecompose = async () => {
    setActionLoading(true);
    try {
      await decomposeTaskIntoSubtasks(currentTask);
      await delegateUnassignedSubtasks(currentTask.id);
      await reloadDetails(currentTask.id);
      onRefresh();
    } catch (err) {
      console.error("[AUTO DECOMPOSE ERROR]:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const completedSubtaskCount = childTasks.filter((d) => d.status === "SATISFIED").length;
  const subtaskProgress = childTasks.length > 0 ? Math.round((completedSubtaskCount / childTasks.length) * 100) : 0;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Task Details & Orchestration</span>
          <h2 className="text-lg font-extrabold text-slate-100 mt-0.5">{currentTask.title}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">
        {/* Subtask Status Alert if WAITING */}
        {currentTask.status === "WAITING" && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center space-x-3">
            <Clock className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold block">Awaiting Child Subtasks</span>
              <span>Parent task is paused while subtasks execute. Will automatically resume upon completion.</span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {currentTask.status === "ASSIGNED" && (
            <button
              onClick={handleStart}
              disabled={actionLoading}
              className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 inline-flex items-center space-x-1"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Execution</span>
            </button>
          )}

          {(currentTask.status === "RUNNING" || currentTask.status === "WAITING") && (
            <>
              <button
                onClick={handleComplete}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 inline-flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Complete</span>
              </button>
              <button
                onClick={handleFail}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/30"
              >
                Mark Failed
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700"
              >
                Cancel
              </button>
            </>
          )}

          <button
            onClick={() => setShowSubtaskForm(true)}
            className="px-3.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold text-xs rounded-xl border border-purple-500/30 transition-colors inline-flex items-center space-x-1.5 ml-auto"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Delegate Subtask</span>
          </button>
        </div>

        {/* Assignment & Metadata Controls */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Assigned Agent</span>
            <select
              value={currentTask.assigned_agent_id || ""}
              onChange={(e) => handleAssignAgent(e.target.value)}
              disabled={actionLoading}
              className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs"
            >
              <option value="">-- Unassigned --</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role})
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-emerald-400">{currentTask.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Priority:</span>
              <span className="font-bold text-amber-400">{currentTask.priority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Progress:</span>
              <span className="font-bold text-slate-200">{currentTask.progress}%</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2 text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px]">Task Description</span>
          <p className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 leading-relaxed">
            {currentTask.description || "No description provided."}
          </p>
        </div>

        {/* Child Subtasks & Dependency Tree Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <GitFork className="w-4 h-4 text-purple-400" /> Multi-Agent Subtasks ({childTasks.length})
            </span>
            <div className="flex items-center space-x-2">
              {childTasks.length === 0 && (
                <button
                  onClick={handleAutoDecompose}
                  disabled={actionLoading}
                  className="px-2.5 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-purple-300 text-[10px] font-bold rounded-lg border border-purple-500/30 flex items-center space-x-1 transition-all"
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Auto-Decompose Plan</span>
                </button>
              )}
              {childTasks.length > 0 && (
                <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {subtaskProgress}% Complete ({completedSubtaskCount}/{childTasks.length})
                </span>
              )}
            </div>
          </div>

          {/* Subtask Progress Bar */}
          {childTasks.length > 0 && (
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-purple-500 h-full transition-all duration-300"
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>
          )}

          {childTasks.length === 0 ? (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <p className="text-slate-400">No subtasks created for this parent task yet.</p>
              <p className="text-[11px] text-slate-500">
                Click &quot;Auto-Decompose Plan&quot; to automatically split this task into an ordered multi-agent subtask workflow.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {childTasks.map((dep) => {
                const child = dep.child_task;
                if (!child) return null;
                const isComplete = dep.status === "SATISFIED" || child.status === "COMPLETED";

                return (
                  <div
                    key={dep.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <ArrowRight className="w-3 h-3 text-purple-400" />
                        <span className="font-bold text-slate-200">{child.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                        <Bot className="w-3 h-3 text-blue-400" />
                        <span>{child.assigned_agent?.name || "Unassigned"}</span>
                        <span>•</span>
                        <span className={isComplete ? "text-emerald-400 font-bold" : "text-amber-400"}>
                          {isComplete ? "SATISFIED" : child.status}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        isComplete
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {isComplete ? "COMPLETED" : "IN PROGRESS"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Subtask Form Modal */}
          {showSubtaskForm && (
            <form onSubmit={handleCreateSubtask} className="p-4 bg-slate-950 border border-purple-500/30 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-purple-300 flex items-center gap-1.5">
                <GitFork className="w-4 h-4 text-purple-400" /> Delegate New Subtask
              </h4>

              <input
                type="text"
                placeholder="Subtask Title *"
                value={subTitle}
                onChange={(e) => setSubTitle(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono"
                required
              />

              <textarea
                rows={2}
                placeholder="Subtask Instructions & Description"
                value={subDesc}
                onChange={(e) => setSubDesc(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-[11px]"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Assign Subtask Agent</label>
                  <select
                    value={subAssignedAgentId}
                    onChange={(e) => setSubAssignedAgentId(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs"
                  >
                    <option value="">-- Match by Role --</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Subtask Priority</label>
                  <select
                    value={subPriority}
                    onChange={(e) => setSubPriority(e.target.value as "LOW" | "NORMAL" | "HIGH" | "CRITICAL")}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs"
                  >
                    <option value="LOW">LOW</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSubtaskForm(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSubtask}
                  className="px-4 py-1.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold rounded-lg"
                >
                  {creatingSubtask ? "Delegating..." : "Create & Delegate Subtask"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Task Execution Output & Reasoning */}
        {taskOutput && (
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" /> AI Task Execution Output & Reasoning
            </span>

            <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-100">{currentTask.title}</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/30">
                  {taskOutput.agent?.name || "EXECUTED AI OUTPUT"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Executive Summary</span>
                <p className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-emerald-300 font-semibold text-xs leading-relaxed">
                  {taskOutput.summary}
                </p>
              </div>

              {taskOutput.reasoning && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Operational Reasoning</span>
                  <p className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono text-[11px] leading-relaxed">
                    {taskOutput.reasoning}
                  </p>
                </div>
              )}

              {taskOutput.output && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Full Deliverable Output</span>
                  <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {taskOutput.output}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tool Orchestration History */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" /> Tool Execution History ({toolExecutions.length})
          </span>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
            {toolExecutions.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {toolExecutions.map((tex) => (
                  <div key={tex.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-x-2">
                        <span className="font-bold text-slate-200">{tex.tool_name}</span>
                        <span className="text-[10px] font-mono text-slate-400">({tex.tool_id})</span>
                      </div>
                      <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                        <span className="text-slate-400">{tex.execution_time_ms}ms</span>
                        {tex.attempt_count > 1 && (
                          <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/30">
                            {tex.attempt_count} ATTEMPTS
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            tex.status === "SUCCESS"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : tex.status === "TIMED_OUT"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {tex.status}
                        </span>
                      </div>
                    </div>

                    {tex.error_message && (
                      <p className="text-[10px] font-mono text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/30">
                        {tex.error_message}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-500 block mb-0.5">Input:</span>
                        <pre className="p-2 bg-slate-950 rounded text-slate-300 overflow-x-auto max-h-40 leading-relaxed whitespace-pre-wrap">
                          {formatToolPayload(tex.input)}
                        </pre>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Output:</span>
                        <pre className="p-2 bg-slate-950 rounded text-emerald-400 overflow-x-auto max-h-40 leading-relaxed whitespace-pre-wrap">
                          {formatToolPayload(tex.output)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 font-mono text-[11px]">
                No tool executions recorded for this task yet.
              </p>
            )}
          </div>
        </div>

        {/* Web Research Section */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-400" /> Web Research & Visited Pages
          </span>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
            {/* Image Screenshots Preview */}
            {artifacts.filter((a) => a.artifact_type === "image").length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Captured Page Screenshots
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {artifacts
                    .filter((a) => a.artifact_type === "image")
                    .map((img) => (
                      <div key={img.id} className="p-2 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                        <span className="text-[10px] text-slate-300 font-bold truncate block">{img.title}</span>
                        {img.content_or_url?.startsWith("data:image") ? (
                          <img src={img.content_or_url} alt={img.title} className="w-full h-24 object-cover rounded border border-slate-800" />
                        ) : (
                          <span className="text-[9px] text-slate-500 font-mono block">Image captured</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Research Reports */}
            {artifacts.filter((a) => a.title.toLowerCase().includes("research") || a.title.toLowerCase().includes("summary")).length > 0 ? (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">Research Reports</span>
                {artifacts
                  .filter((a) => a.title.toLowerCase().includes("research") || a.title.toLowerCase().includes("summary"))
                  .map((rep) => (
                    <div key={rep.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                      <span className="font-bold text-slate-200 block">{rep.title}</span>
                      <p className="text-[11px] text-slate-400 line-clamp-3 font-mono">
                        {rep.content_or_url}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-slate-500 font-mono text-[11px]">
                No web research summaries generated yet. Execute &apos;web_search&apos;, &apos;read_website&apos;, or &apos;summarize_page&apos; tools during agent runs.
              </p>
            )}
          </div>
        </div>

        {/* MACE Final Merged Output Viewer */}
        {mergedOutput && (
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" /> MACE v1 Merged Deliverable Package
            </span>

            <div className="p-4 bg-slate-950 border border-purple-500/30 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-100">{mergedOutput.title}</span>
                <span className="text-[10px] font-mono text-purple-400 font-bold px-2 py-0.5 bg-purple-500/10 rounded border border-purple-500/30">
                  MACE MERGE ENGINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{mergedOutput.summary}</p>
              <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60 leading-relaxed whitespace-pre-wrap">
                {mergedOutput.merged_content}
              </pre>
            </div>
          </div>
        )}

        {/* Task Artifacts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" /> Task Artifacts ({artifacts.length})
            </span>
            <button
              onClick={() => setShowArtifactForm(true)}
              className="text-[11px] px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold rounded-lg border border-cyan-500/30 transition-colors flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Artifact</span>
            </button>
          </div>

          {showArtifactForm && (
            <form onSubmit={handleAddArtifact} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
              <input
                type="text"
                placeholder="Artifact Title"
                value={artTitle}
                onChange={(e) => setArtTitle(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono"
                required
              />
              <textarea
                rows={3}
                placeholder="Artifact Content or Output URL"
                value={artContent}
                onChange={(e) => setArtContent(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-[11px]"
                required
              />
              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowArtifactForm(false)}
                  className="px-3 py-1 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingArtifact}
                  className="px-3.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg"
                >
                  Save Artifact
                </button>
              </div>
            </form>
          )}

          {artifacts.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono p-3 bg-slate-950 border border-slate-800 rounded-xl">
              No artifacts attached to this task.
            </p>
          ) : (
            <div className="space-y-2">
              {artifacts.map((art) => (
                <div key={art.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-cyan-300 block">{art.title}</span>
                  <p className="text-slate-400 text-[11px] font-mono leading-relaxed line-clamp-2">{art.content_or_url}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timeline Events */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">Task Timeline Events</span>
          {events.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono">No timeline events recorded.</p>
          ) : (
            <div className="space-y-2 text-xs font-mono">
              {events.map((ev) => (
                <div key={ev.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-200 block">{ev.event_type}</span>
                    <span className="text-slate-400 font-sans text-[11px]">{ev.message}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(ev.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
