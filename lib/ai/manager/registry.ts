import type { SpecializedAgent } from "./types";
import { researchAgent } from "../agents/research-agent";
import { seoAgent } from "../agents/seo-agent";
import { marketingAgent } from "../agents/marketing-agent";

class AgentRegistry {
  private agents = new Map<string, SpecializedAgent>();

  constructor() {
    this.register(researchAgent);
    this.register(seoAgent);
    this.register(marketingAgent);
  }

  register(agent: SpecializedAgent) {
    this.agents.set(agent.id, agent);
  }

  get(id: string): SpecializedAgent | undefined {
    return this.agents.get(id);
  }

  getAll(): SpecializedAgent[] {
    return Array.from(this.agents.values());
  }
}

export const agentRegistry = new AgentRegistry();
