"use client";

import {
  Bot,
  Play,
  CheckCircle2,
  XCircle,
  Radio,
  Clock,
  ChevronRight,
} from "lucide-react";
import type { TaskRow, TaskStatus, TaskPriority } from "@/types/task";

interface TasksListViewProps {
  tasks: TaskRow[];
  onSelectTask: (task: TaskRow) => void;
  onStartTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
}

function getStatusBadge(status: TaskStatus) {
  switch (status) {
    case "RUNNING":
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
          <span>RUNNING</span>
        </span>
      );
    case "COMPLETED":
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
          <CheckCircle2 className="w-3 h-3 text-purple-400" />
          <span>COMPLETED</span>
        </span>
      );
    case "ASSIGNED":
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
          <Bot className="w-3 h-3 text-blue-400" />
          <span>ASSIGNED</span>
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <XCircle className="w-3 h-3 text-rose-400" />
          <span>FAILED</span>
        </span>
      );
    case "WAITING":
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>WAITING</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{status}</span>
        </span>
      );
  }
}

function getPriorityBadge(priority: TaskPriority) {
  switch (priority) {
    case "CRITICAL":
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          CRITICAL
        </span>
      );
    case "HIGH":
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          HIGH
        </span>
      );
    case "NORMAL":
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
          NORMAL
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          LOW
        </span>
      );
  }
}

export function TasksListView({
  tasks,
  onSelectTask,
  onStartTask,
  onCompleteTask,
}: TasksListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="p-12 border border-slate-800 rounded-2xl bg-slate-900/50 text-center text-xs text-slate-500">
        No tasks match the active filter criteria.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-mono font-bold">
            <tr>
              <th className="p-4">Task Title & Description</th>
              <th className="p-4">Status</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Assigned Agent</th>
              <th className="p-4">Progress</th>
              <th className="p-4">Created</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <td className="p-4 max-w-xs">
                  <span className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors block truncate">
                    {task.title}
                  </span>
                  {task.description && (
                    <span className="text-[11px] text-slate-400 block truncate">
                      {task.description}
                    </span>
                  )}
                </td>

                <td className="p-4">{getStatusBadge(task.status)}</td>

                <td className="p-4">{getPriorityBadge(task.priority)}</td>

                <td className="p-4">
                  {task.assigned_agent ? (
                    <span className="inline-flex items-center space-x-1.5 font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      <Bot className="w-3.5 h-3.5" />
                      <span>{task.assigned_agent.name}</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono">Unassigned</span>
                  )}
                </td>

                <td className="p-4 w-36">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span>{task.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                </td>

                <td className="p-4 font-mono text-slate-400 text-[11px]">
                  {new Date(task.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                </td>

                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end space-x-2">
                    {task.status === "ASSIGNED" && (
                      <button
                        onClick={() => onStartTask(task.id)}
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/30 transition-colors flex items-center space-x-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start</span>
                      </button>
                    )}

                    {task.status === "RUNNING" && (
                      <button
                        onClick={() => onCompleteTask(task.id)}
                        className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold rounded-lg border border-purple-500/30 transition-colors flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Complete</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectTask(task)}
                      className="p-1.5 text-slate-400 hover:text-slate-200"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
