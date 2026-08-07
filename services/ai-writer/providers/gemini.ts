/**
 * services/ai-writer/providers/gemini.ts
 */

import type { AIWriterProvider, AIWriterGenerationOptions, AIWriterHealthStatus } from "../provider-interface";

export class GeminiProvider implements AIWriterProvider {
  id = "gemini";
  name = "Google Gemini Provider";

  supportsJson(): boolean { return true; }
  supportsImages(): boolean { return true; }
  supportsThinking(): boolean { return true; }

  async health(): Promise<AIWriterHealthStatus> {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    return {
      status: hasKey ? "HEALTHY" : "UNAVAILABLE",
      providerId: this.id,
      latencyMs: 10,
      message: hasKey ? undefined : "GEMINI_API_KEY environment variable missing",
    };
  }

  async generate(options: AIWriterGenerationOptions): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key unavailable.");
    }
    return `Gemini generated output for prompt length ${options.prompt.length}`;
  }
}
