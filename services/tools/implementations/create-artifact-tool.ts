/**
 * services/tools/implementations/create-artifact-tool.ts
 *
 * Built-in Tool: create_artifact
 * Category: Content
 */

import { BaseTool } from "../base-tool";
import type { ToolCategory, ToolExecutionContext, ToolResult } from "../types";

export class CreateArtifactTool extends BaseTool {
  id = "create_artifact";
  name = "Create Artifact";
  description = "Generates and attaches a persistent task output artifact (document, code, or report).";
  category: ToolCategory = "Content";
  permissions = ["artifacts:write"];

  async execute(
    input: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<Omit<ToolResult, "executionTimeMs">> {
    const title = (input.title as string) || "Agent Generated Output";
    const artifactType = (input.artifactType as string) || "document";
    const content = (input.content as string) || "Generated content payload.";

    return {
      success: true,
      output: {
        artifactId: "art-" + Math.random().toString(36).substring(2, 9),
        taskId: context.taskId || "task-preview",
        title,
        type: artifactType,
        contentPreview: content.substring(0, 80),
        status: "Artifact created and attached successfully.",
      },
    };
  }
}
