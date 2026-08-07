/**
 * services/execution-engine/prompt-builder.ts
 *
 * Prompt Builder Module (Knowledge-Aware - Phase 3.2 Production)
 * Formats system prompt, user prompt, and metadata from an ExecutionContext object.
 * Enforces standardized prompt structure:
 * 1. SYSTEM
 * 2. RELEVANT KNOWLEDGE
 * 3. PREVIOUS RESULTS
 * 4. CURRENT TASK
 * 5. AVAILABLE TOOLS
 * 6. USER GOAL
 */

import type { ExecutionContext, GeneratedPrompt } from "./types";

export function buildPrompt(context: ExecutionContext): GeneratedPrompt {
  const { task, agent, memories, dependencyOutputs = [], acpMessages = [], knowledgeContext } = context;

  // 1. RELEVANT KNOWLEDGE SECTION
  const knowledgeDocs = knowledgeContext?.documents || [];
  const knowledgeText =
    knowledgeDocs.length > 0
      ? knowledgeDocs
          .map(
            (k) =>
              `### Document: ${k.title} (Collection: ${k.collectionName} | Relevance Score: ${Math.round(k.relevanceScore * 100)}%)\n- **Snippet**: ${k.snippet}\n- **Full Content Summary**:\n${k.cleanContent.slice(0, 1000)}\n`
          )
          .join("\n---\n")
      : "No relevant knowledge documents found in Knowledge Engine.";

  const knowledgeDecisionNotice = knowledgeContext?.hasSufficientKnowledge
    ? `\n✓ HIGH-CONFIDENCE KNOWLEDGE AVAILABLE (Relevance: ${Math.round((knowledgeContext?.highestRelevanceScore || 0) * 100)}%). Rely on this retrieved knowledge to complete the task. Skip unnecessary web search tools unless specific missing facts require them.\n`
    : "";

  // 2. PREVIOUS RESULTS SECTION
  const privateMemText =
    memories.privateMemories.length > 0
      ? memories.privateMemories
          .map((m) => `- [PRIVATE] ${m.key}: ${JSON.stringify(m.value)}`)
          .join("\n")
      : "No private memories stored.";

  const sharedMemText =
    memories.sharedMemories.length > 0
      ? memories.sharedMemories
          .map((m) => `- [SHARED] ${m.key}: ${JSON.stringify(m.value)}`)
          .join("\n")
      : "No shared memories stored.";

  const depOutputsText =
    dependencyOutputs.length > 0
      ? dependencyOutputs
          .map(
            (d) =>
              `### Prerequisite Output: ${d.title}\n- **Summary**: ${d.summary}\n- **Full Deliverable**:\n${d.output}\n`
          )
          .join("\n---\n")
      : "No prior dependency outputs attached.";

  const acpMessagesText =
    acpMessages.length > 0
      ? acpMessages
          .map((m) => `- [${m.type}] From ${m.senderName}: "${m.content}"`)
          .join("\n")
      : "No unread ACP inter-agent messages.";

  // SYSTEM SECTION
  const systemPrompt = `=== SYSTEM ===
You are ${agent.name}, an autonomous AI agent operating within Aura OS.
Role: ${agent.role}
Description: ${agent.description || "Operational execution agent."}
Memory Scope Setting: ${agent.memoryScope}

=== RELEVANT KNOWLEDGE ===
${knowledgeText}
${knowledgeDecisionNotice}
=== PREVIOUS RESULTS ===
PRIVATE MEMORY:
${privateMemText}

SHARED MEMORY:
${sharedMemText}

COMPLETED DEPENDENCY TASK OUTPUTS:
${depOutputsText}

ACP INTER-AGENT MESSAGES:
${acpMessagesText}

=== AVAILABLE TOOLS (${agent.enabledTools.length}) ===
${agent.enabledTools.length > 0 ? agent.enabledTools.map((t) => `- ${t}`).join("\n") : "None attached."}

Connected Integrations (${agent.connectedIntegrations.length}):
${agent.connectedIntegrations.length > 0 ? agent.connectedIntegrations.map((i) => `- ${i}`).join("\n") : "None attached."}

=== USER GOAL & MANDATORY OUTPUT FORMAT ===
Produce real, production-ready operational outputs for assigned tasks. Never return fake, empty, or placeholder responses.
You MUST execute the assigned task thoroughly and return a valid JSON object matching the following structure:

\`\`\`json
{
  "summary": "Concise executive summary of what was accomplished and key metrics",
  "reasoning": "Step-by-step technical reasoning and operational logic behind the deliverable",
  "output": "Complete, comprehensive, fully-formatted markdown deliverable (e.g. keywords list, blog post, audit report, competitor analytics, campaign plan)",
  "artifacts": [
    {
      "type": "DOCUMENT",
      "title": "Descriptive Artifact Title",
      "content": "Full artifact content"
    }
  ],
  "next_steps": [
    "Actionable next step 1",
    "Actionable next step 2"
  ]
}
\`\`\`

Rules:
1. Provide actual, thorough deliverables in 'output'.
2. Populate 'artifacts' with key standalone sub-deliverables.
3. Do NOT wrap with conversational preamble. Return JSON.`;

  // CURRENT TASK SECTION
  const userPrompt = `=== CURRENT TASK ===
Title: ${task.title}
Priority: ${task.priority}
Description: ${task.description || "No further details provided."}

Task Metadata:
${JSON.stringify(task.metadata, null, 2)}`;

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      generatedAt: new Date().toISOString(),
      taskId: task.id,
      agentId: agent.id,
      toolCount: agent.enabledTools.length,
      integrationCount: agent.connectedIntegrations.length,
      privateMemoryCount: memories.privateMemories.length,
      sharedMemoryCount: memories.sharedMemories.length,
      knowledgeDocumentCount: knowledgeDocs.length,
      highestKnowledgeRelevance: knowledgeContext?.highestRelevanceScore || 0,
    },
  };
}
