import { MemoryFeature } from "@/features/memory/memory-feature";
import { getAllMemoriesWithAgents } from "@/services/memory";
import { getAgentsService } from "@/services/agent";

export const metadata = {
  title: "Agent Memory System v1 | Aura OS",
  description: "Manage long-term agent memories across Private and Shared scopes.",
};

export default async function SharedMemoryPage() {
  const [memories, agents] = await Promise.all([
    getAllMemoriesWithAgents(),
    getAgentsService(),
  ]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <MemoryFeature initialMemories={memories} agents={agents} />
    </div>
  );
}
