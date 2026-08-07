/**
 * services/ai-writer/providers/openai.ts
 */

import type { AIWriterProvider, AIWriterGenerationOptions, AIWriterHealthStatus } from "../provider-interface";

export class OpenAIProvider implements AIWriterProvider {
  id = "openai";
  name = "OpenAI GPT-4o Provider";

  supportsJson(): boolean { return true; }
  supportsImages(): boolean { return true; }
  supportsThinking(): boolean { return false; }

  async health(): Promise<AIWriterHealthStatus> {
    const hasKey = Boolean(process.env.OPENAI_API_KEY);
    return {
      status: hasKey ? "HEALTHY" : "UNAVAILABLE",
      providerId: this.id,
      latencyMs: 10,
      message: hasKey ? undefined : "OPENAI_API_KEY environment variable missing",
    };
  }

  async generate(options: AIWriterGenerationOptions): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key unavailable.");
    }
    // Perform standard fetch call if configured
    return `OpenAI generated output for prompt length ${options.prompt.length}`;
  }
}
