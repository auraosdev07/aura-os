/**
 * services/acp/request-info-tool.ts
 *
 * Request Agent Info Tool (request_agent_info)
 * Allows executing AI agents to send an inter-agent REQUEST_INFO message to another agent
 * or broadcast to all agents when blocked or requiring dataset clarification.
 */

import { BaseTool } from "../tools/base-tool";
import type { ToolCategory, ToolExecutionContext, ToolResult } from "../tools/types";

export class RequestAgentInfoTool extends BaseTool {
  id = "request_agent_info";
  name = "Request Agent Info";
  description = "Sends an inter-agent REQUEST_INFO message to another agent or broadcasts to all agents when requiring dataset clarification.";
  category: ToolCategory = "Communication";
  permissions = ["acp:send", "network:write"];

  async execute(
    input: Record<string, unknown>,
    context?: ToolExecutionContext
  ): Promise<Omit<ToolResult, "executionTimeMs">> {
    const targetAgentId = input.targetAgentId ? String(input.targetAgentId) : null;
    const subject = String(input.subject || "Information Request").trim();
    const content = String(input.content || input.question || input.query || "").trim();

    if (!content) {
      return {
        success: false,
        output: "Question/content string is required.",
        error: "Missing required parameter 'content' or 'question'.",
      };
    }

    if (!context?.agentId) {
      return {
        success: false,
        output: "Agent context is required.",
        error: "Execution context missing agentId.",
      };
    }

    try {
      const { sendDirectMessage, sendBroadcastMessage } = await import("./messaging-service");

      let msgResult;
      if (targetAgentId) {
        msgResult = await sendDirectMessage({
          sender_agent_id: context.agentId,
          recipient_agent_id: targetAgentId,
          subject,
          content,
          message_type: "REQUEST_INFO",
          parent_task_id: context.taskId,
        });
      } else {
        msgResult = await sendBroadcastMessage({
          sender_agent_id: context.agentId,
          subject,
          content,
          message_type: "REQUEST_INFO",
          parent_task_id: context.taskId,
        });
      }

      return {
        success: true,
        output: JSON.stringify({
          messageId: msgResult.id,
          threadId: msgResult.thread_id,
          type: msgResult.message_type,
          status: msgResult.status,
          note: `ACP Request Info message sent successfully to ${targetAgentId ? `agent #${targetAgentId.substring(0, 8)}` : "all agents (Broadcast)"}.`,
        }),
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Request agent info execution failed";
      return {
        success: false,
        output: "Request agent info failed",
        error: errorMsg,
      };
    }
  }
}
