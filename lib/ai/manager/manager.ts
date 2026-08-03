import { agentRegistry } from "./registry";
import type { AgentInput, AgentOutput, ManagerResult } from "./types";

export class ManagerEngine {
  selectAgents(query: string): string[] {
    const q = query.toLowerCase();
    const selected: string[] = [];

    if (q.includes("research")) {
      selected.push("research");
    }
    if (q.includes("seo")) {
      selected.push("seo");
    }
    if (q.includes("marketing")) {
      selected.push("marketing");
    }

    return selected;
  }

  async processRequest(input: AgentInput): Promise<ManagerResult | null> {
    const selectedIds = this.selectAgents(input.userQuery);

    if (selectedIds.length === 0) {
      return null; // Fallback to standard chatbot behavior
    }

    console.log("Manager");
    const outputs: AgentOutput[] = [];

    for (const id of selectedIds) {
      const agent = agentRegistry.get(id);
      if (agent) {
        const output = await agent.execute(input);
        outputs.push(output);
      }
    }

    console.log("\n↓\nMerge ✔");

    const mergedSections = outputs.map(
      (out) => `### ${out.agentName}\n${out.text}`
    );
    const mergedText = mergedSections.join("\n\n---\n\n");

    return {
      agentsExecuted: selectedIds,
      mergedText,
      individualOutputs: outputs,
    };
  }
}

export const managerEngine = new ManagerEngine();
