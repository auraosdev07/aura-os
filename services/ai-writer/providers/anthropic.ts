/**
 * services/ai-writer/providers/anthropic.ts
 */

import type { AIWriterProvider, AIWriterGenerationOptions, AIWriterHealthStatus } from "../provider-interface";

export class AnthropicProvider implements AIWriterProvider {
  id = "anthropic";
  name = "Anthropic Claude Provider";

  supportsJson(): boolean { return true; }
  supportsImages(): boolean { return true; }
  supportsThinking(): boolean { return true; }

  async health(): Promise<AIWriterHealthStatus> {
    const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
    return {
      status: hasKey ? "HEALTHY" : "UNAVAILABLE",
      providerId: this.id,
      latencyMs: 10,
      message: hasKey ? undefined : "ANTHROPIC_API_KEY environment variable missing",
    };
  }

  async generate(options: AIWriterGenerationOptions): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Anthropic API key unavailable.");
    }
    return `Anthropic generated output for prompt length ${options.prompt.length}`;
  }
}
