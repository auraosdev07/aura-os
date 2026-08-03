"use client";

import { useState, useCallback } from "react";
import {
  CheckSquare,
  Search,
  LayoutGrid,
  List,
  Plus,
  Radio,
} from "lucide-react";
import { TasksKanbanView } from "./tasks-kanban-view";
import { TasksListView } from "./tasks-list-view";
import { TaskDrawer } from "./task-drawer";
import { CreateTaskModal } from "./create-task-modal";
import { getTasks, startTask, completeTask } from "@/services/task";
import type { TaskRow } from "@/types/task";
import type { AgentRow } from "@/types/agent";

interface TasksFeatureProps {
  initialTasks: TaskRow[];
  agents: AgentRow[];
}

export function TasksFeature({ initialTasks, agents }: TasksFeatureProps) {
  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [agentFilter, setAgentFilter] = useState("ALL");

  // Drawer & Modal State
  const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const refreshTasks = useCallback(async () => {
    try {
      const updated = await getTasks();
      setTasks(updated);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleStartTask = async (taskId: string) => {
    try {
      await startTask(taskId);
      await refreshTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      await refreshTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter tasks in memory
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "ALL" && task.status !== statusFilter) return false;
    if (priorityFilter !== "ALL" && task.priority !== priorityFilter) return false;
    if (agentFilter !== "ALL" && task.assigned_agent_id !== agentFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = (task.description || "").toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <CheckSquare className="w-7 h-7 text-emerald-400" /> Task Orchestrator Foundation
            </h1>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>{tasks.length} TASKS ORCHESTRATED</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Central task orchestration system for autonomous AI agents, state transitions, events, and artifacts.
          </p>
        </div>

        {/* Create Task Trigger */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 text-xs px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      {/* Toolbar: Search, Filters, View Switcher */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
          />
        </div>

        {/* Filter Dropdowns & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono"
          >
            <option value="ALL">Status: All</option>
            <option value="CREATED">CREATED</option>
            <option value="QUEUED">QUEUED</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="RUNNING">RUNNING</option>
            <option value="WAITING">WAITING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono"
          >
            <option value="ALL">Priority: All</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="NORMAL">NORMAL</option>
            <option value="LOW">LOW</option>
          </select>

          {/* Agent Filter */}
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono max-w-[150px] truncate"
          >
            <option value="ALL">Agent: All</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* View Switcher */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "kanban" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main View: Kanban vs List */}
      {viewMode === "kanban" ? (
        <TasksKanbanView
          tasks={filteredTasks}
          onSelectTask={(t) => setSelectedTask(t)}
          onStartTask={handleStartTask}
          onCompleteTask={handleCompleteTask}
        />
      ) : (
        <TasksListView
          tasks={filteredTasks}
          onSelectTask={(t) => setSelectedTask(t)}
          onStartTask={handleStartTask}
          onCompleteTask={handleCompleteTask}
        />
      )}

      {/* Task Details Drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          agents={agents}
          onClose={() => setSelectedTask(null)}
          onRefresh={refreshTasks}
        />
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          agents={agents}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newTask) => {
            setTasks((prev) => [newTask, ...prev]);
            setSelectedTask(newTask);
          }}
        />
      )}
    </div>
  );
}
