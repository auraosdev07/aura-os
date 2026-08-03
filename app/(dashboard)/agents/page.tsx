import { AgentsListFeature } from "@/features/agents/agents-list-feature";
import { getAgentsService } from "@/services/agent";

export const metadata = {
  title: "Agents Workspace | Agent Runtime Foundation | Aura OS",
  description: "Manage autonomous AI agents, pluggable tools, memory scopes, and runtime execution.",
};

export default async function AgentsPage() {
  const agents = await getAgentsService();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <AgentsListFeature initialAgents={agents} />
    </div>
  );
}
