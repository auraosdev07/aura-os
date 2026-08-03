import { notFound } from "next/navigation";
import { AgentDetailFeature } from "@/features/agents/agent-detail-feature";
import { getFullAgentDetailsByIdService } from "@/services/agent";
import { getTasksForAgent } from "@/services/task";

export const metadata = {
  title: "Agent Detail | Agent Runtime Foundation | Aura OS",
  description: "View agent status, tools, memory, integrations, tasks, and activity timeline.",
};

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = await params;

  const [details, agentTasks] = await Promise.all([
    getFullAgentDetailsByIdService(id),
    getTasksForAgent(id),
  ]);

  if (!details) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <AgentDetailFeature initialDetails={details} agentTasks={agentTasks} />
    </div>
  );
}
