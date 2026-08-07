import type { Metadata } from "next";
import { ManagerFeature } from "@/features/managers/manager-feature";
import { TaskDependencyGraphWidget } from "@/features/managers/task-dependency-graph-widget";

export const metadata: Metadata = {
  title: "Managers & Task Dependencies | Aura OS",
  description: "Manager Runtime supervision and multi-agent task dependency orchestration graph.",
};

export default function ManagersPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manager Supervision & Collaboration</h2>
          <p className="text-xs text-slate-400 mt-1">
            Supervise AI managers, agent task allocations, and multi-agent subtask delegation trees.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <TaskDependencyGraphWidget />
        <ManagerFeature />
      </div>
    </div>
  );
}
