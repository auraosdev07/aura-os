import { ToolsFeature } from "@/features/tools/tools-feature";
import { getAgentsService } from "@/services/agent";

export const metadata = {
  title: "Tool Framework v1 | Aura OS",
  description: "Central tool registry and execution framework for autonomous AI agents.",
};

export default async function ToolsPage() {
  const agents = await getAgentsService();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <ToolsFeature agents={agents} />
    </div>
  );
}
