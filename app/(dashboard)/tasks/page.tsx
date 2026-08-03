import { TasksFeature } from "@/features/tasks/tasks-feature";
import { getTasks } from "@/services/task";
import { getAgentsService } from "@/services/agent";

export const metadata = {
  title: "Tasks Orchestrator Foundation | Aura OS",
  description: "Central task management system for autonomous AI agents and operational workflows.",
};

export default async function TasksPage() {
  const [tasks, agents] = await Promise.all([getTasks(), getAgentsService()]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <TasksFeature initialTasks={tasks} agents={agents} />
    </div>
  );
}
