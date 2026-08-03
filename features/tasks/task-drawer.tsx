"use client";

import { useState, useEffect } from "react";
import {
  X,
  Play,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
} from "lucide-react";
import {
  getTaskById,
  assignTask,
  startTask,
  completeTask,
  failTask,
  cancelTask,
  addTaskArtifact,
} from "@/services/task";
import type { TaskRow, FullTaskDetails } from "@/types/task";
import type { AgentRow } from "@/types/agent";

interface TaskDrawerProps {
  task: TaskRow | null;
  agents: AgentRow[];
  onClose: () => void;
  onRefresh: () => void;
}

export function TaskDrawer({ task, agents, onClose, onRefresh }: TaskDrawerProps) {
  const [details, setDetails] = useState<FullTaskDetails | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // New Artifact State
  const [showArtifactForm, setShowArtifactForm] = useState(false);
  const [artTitle, setArtTitle] = useState("");
  const [artType] = useState("document");
  const [artContent, setArtContent] = useState("");
  const [addingArtifact, setAddingArtifact] = useState(false);

  const reloadDetails = async (taskId: string) => {
    try {
      const full = await getTaskById(taskId);
      if (full) setDetails(full);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!task) return;
    let active = true;

    getTaskById(task.id).then((full) => {
      if (active && full) {
        setDetails(full);
      }
    });

    return () => {
      active = false;
    };
  }, [task]);

  if (!task) return null;

  const currentTask = details?.task || task;

  const handleAssignAgent = async (agentId: string) => {
    if (!agentId) return;
    setActionLoading(true);
    try {
      await assignTask(task.id, agentId);
      await reloadDetails(task.id);
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
      await startTask(task.id);
      await reloadDetails(task.id);
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
      await completeTask(task.id);
      await reloadDetails(task.id);
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
      await failTask(task.id, "Manually flagged as failed by user.");
      await reloadDetails(task.id);
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
      await cancelTask(task.id, "Cancelled by user.");
      await reloadDetails(task.id);
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
      await addTaskArtifact(task.id, artTitle.trim(), artType, artContent.trim());
      setArtTitle("");
      setArtContent("");
      setShowArtifactForm(false);
      await reloadDetails(task.id);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingArtifact(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 flex flex-col justify-between shadow-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Task Details Drawer
              </span>
              <h2 className="text-xl font-bold text-slate-100 mt-1">{currentTask.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
            {currentTask.status === "ASSIGNED" && (
              <button
                onClick={handleStart}
                disabled={actionLoading}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Execution</span>
              </button>
            )}

            {currentTask.status === "RUNNING" && (
              <button
                onClick={handleComplete}
                disabled={actionLoading}
                className="px-3.5 py-1.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-lg shadow-purple-500/20"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Complete Task</span>
              </button>
            )}

            {["ASSIGNED", "RUNNING", "WAITING"].includes(currentTask.status) && (
              <>
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

          {/* Task Artifacts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" /> Task Artifacts ({details?.artifacts?.length ?? 0})
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
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                  required
                />
                <textarea
                  rows={2}
                  placeholder="Content or URL..."
                  value={artContent}
                  onChange={(e) => setArtContent(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-[11px]"
                  required
                />
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setShowArtifactForm(false)} className="px-3 py-1 text-slate-400">
                    Cancel
                  </button>
                  <button type="submit" disabled={addingArtifact} className="px-3 py-1 bg-cyan-500 text-slate-950 font-bold rounded-lg">
                    Save Artifact
                  </button>
                </div>
              </form>
            )}

            {(details?.artifacts || []).length > 0 && (
              <div className="space-y-2 text-xs">
                {details?.artifacts.map((art) => (
                  <div key={art.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <span className="font-bold text-slate-200 block">{art.title}</span>
                    <pre className="text-[11px] font-mono text-slate-400 truncate">{art.content_or_url}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Event Timeline */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-400" /> Event Timeline ({details?.events?.length ?? 0})
            </span>

            <div className="space-y-2 text-xs font-mono">
              {(details?.events || []).map((ev) => (
                <div key={ev.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-purple-400">{ev.event_type}</span>
                    <span className="text-slate-500">{new Date(ev.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs">{ev.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
