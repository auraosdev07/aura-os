"use client";

import { useState } from "react";
import { CheckSquare, X } from "lucide-react";
import { createTask } from "@/services/task";
import type { TaskPriority, TaskRow } from "@/types/task";
import type { AgentRow } from "@/types/agent";

interface CreateTaskModalProps {
  agents: AgentRow[];
  onClose: () => void;
  onCreated: (newTask: TaskRow) => void;
}

export function CreateTaskModal({ agents, onClose, onCreated }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("NORMAL");
  const [assignedAgentId, setAssignedAgentId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const newTask = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigned_agent_id: assignedAgentId || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        estimated_duration: estimatedDuration.trim() || undefined,
      });
      onCreated(newTask);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" /> Create Operational Task
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Task Title *</label>
            <input
              type="text"
              placeholder="e.g. Audit product inventory thresholds & reorder points"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Provide actionable instructions for the assigned AI agent..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="LOW">LOW</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Assign AI Agent</label>
              <select
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="">-- Unassigned --</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Est. Duration</label>
              <input
                type="text"
                placeholder="e.g. 2 hours / 15 mins"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-4 py-2 text-slate-400 hover:text-slate-200 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="text-xs px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20"
          >
            {submitting ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}
