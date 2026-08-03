import type { AIMessage } from "@/lib/ai/types";
import type { ToolContext } from "@/lib/ai/tools/types";

export interface AgentInput {
  userQuery: string;
  messages: AIMessage[];
  provider?: string;
  model?: string;
  context?: ToolContext;
}

export interface AgentOutput {
  agentId: string;
  agentName: string;
  text: string;
  rawResponse?: unknown;
}

export interface SpecializedAgent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  allowedTools: string[];
  execute(input: AgentInput): Promise<AgentOutput>;
}

export interface ManagerResult {
  agentsExecuted: string[];
  mergedText: string;
  individualOutputs: AgentOutput[];
}
