import type { SpecializedAgent, AgentInput, AgentOutput } from "../manager/types";
import { executeAgentHelper } from "./agent-runner";

export const marketingAgent: SpecializedAgent = {
  id: "marketing",
  name: "Marketing Agent",
  description: "Specialized in marketing campaigns, messaging strategy, copy creation, and audience targeting.",
  systemPrompt: "You are the Marketing Agent. Your goal is to design persuasive marketing campaigns, channels, and copy strategies.",
  allowedTools: ["search_knowledge", "list_missions"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    return executeAgentHelper(this, input);
  },
};
