"use client";

import {
  Bot,
  ChevronRight,
  Play,
  CheckCircle2,
} from "lucide-react";
import type { TaskRow, TaskStatus, TaskPriority } from "@/types/task";

interface TasksKanbanViewProps {
  tasks: TaskRow[];
  onSelectTask: (task: TaskRow) => void;
  onStartTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
}

function getPriorityBadge(priority: TaskPriority) {
  switch (priority) {
    case "CRITICAL":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          CRITICAL
        </span>
      );
    case "HIGH":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          HIGH
        </span>
      );
    case "NORMAL":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
          NORMAL
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          LOW
        </span>
      );
  }
}

const KANBAN_COLUMNS: { id: string; label: string; statuses: TaskStatus[]; color: string }[] = [
  { id: "queued", label: "Queued / Created", statuses: ["CREATED", "QUEUED"], color: "text-slate-400" },
  { id: "assigned", label: "Assigned", statuses: ["ASSIGNED"], color: "text-blue-400" },
  { id: "running", label: "Running", statuses: ["RUNNING"], color: "text-emerald-400" },
  { id: "waiting", label: "Waiting / On Hold", statuses: ["WAITING"], color: "text-amber-400" },
  { id: "completed", label: "Completed", statuses: ["COMPLETED"], color: "text-purple-400" },
  { id: "failed", label: "Failed / Cancelled", statuses: ["FAILED", "CANCELLED"], color: "text-rose-400" },
];

export function TasksKanbanView({
  tasks,
  onSelectTask,
  onStartTask,
  onCompleteTask,
}: TasksKanbanViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => col.statuses.includes(t.status));

        return (
          <div
            key={col.id}
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col space-y-3 min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                {col.label}
              </h3>
              <span className="text-[11px] font-mono font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                {colTasks.length}
              </span>
            </div>

            {/* Task Cards */}
            <div className="space-y-3 flex-1">
              {colTasks.length === 0 ? (
                <div className="h-32 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-center p-3">
                  <span className="text-[11px] text-slate-600 font-mono">No tasks</span>
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 group cursor-pointer"
                    onClick={() => onSelectTask(task)}
                  >
                    {/* Priority & Agent */}
                    <div className="flex items-center justify-between">
                      {getPriorityBadge(task.priority)}

                      {task.assigned_agent ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 truncate max-w-[110px]">
                          <Bot className="w-3 h-3 shrink-0" />
                          <span className="truncate">{task.assigned_agent.name}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Unassigned</span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>Progress</span>
                        <span className="text-slate-300 font-bold">{task.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(task.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>

                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        {task.status === "ASSIGNED" && (
                          <button
                            onClick={() => onStartTask(task.id)}
                            className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 transition-colors"
                            title="Start Task Execution"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                        )}
                        {task.status === "RUNNING" && (
                          <button
                            onClick={() => onCompleteTask(task.id)}
                            className="p-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded border border-purple-500/30 transition-colors"
                            title="Mark Completed"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => onSelectTask(task)}
                          className="p-1 text-slate-400 hover:text-slate-200"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
