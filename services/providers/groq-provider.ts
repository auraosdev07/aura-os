/**
 * services/providers/groq-provider.ts
 *
 * Groq AI Provider Implementation
 * Supports Groq models (llama-3.3-70b-versatile, mixtral-8x7b-32768) via OpenAI-compatible endpoint.
 * Reads API key from GROQ_API_KEY environment variable or ProviderConfig override.
 */

import OpenAI from "openai";
import {
  BaseProvider,
  type PromptInput,
  type ProviderConfig,
  type ProviderResponse,
  type ModelInfo,
} from "./base-provider";

export class GroqProvider extends BaseProvider {
  getProviderName(): string {
    return "GROQ";
  }

  listAvailableModels(): ModelInfo[] {
    return [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile", contextWindow: 128000 },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", contextWindow: 128000 },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", contextWindow: 32768 },
    ];
  }

  validateConfiguration(config: ProviderConfig): boolean {
    const apiKey = config.apiKey || process.env.GROQ_API_KEY;
    return !!(apiKey && apiKey.trim().length > 0);
  }

  async executePrompt(input: PromptInput, config: ProviderConfig): Promise<ProviderResponse> {
    const apiKey = config.apiKey || process.env.GROQ_API_KEY;
    const model = config.model || input.model || "llama-3.3-70b-versatile";

    if (!apiKey || apiKey.trim().length === 0) {
      return {
        success: false,
        output: "",
        responseType: "FINAL_RESPONSE",
        usage: { promptTokens: 0, completionTokens: 0 },
        model,
        providerName: this.getProviderName(),
        error: "[Groq Error]: GROQ_API_KEY environment variable is missing.",
      };
    }

    try {
      const groq = new OpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1",
        timeout: 25000,
      });

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (input.systemPrompt) {
        messages.push({ role: "system", content: input.systemPrompt });
      }

      if (input.history && input.history.length > 0) {
        for (const turn of input.history) {
          if (turn.role === "user") {
            messages.push({ role: "user", content: turn.content });
          } else if (turn.role === "assistant") {
            messages.push({ role: "assistant", content: turn.content });
          } else if (turn.role === "tool") {
            messages.push({
              role: "tool",
              content: typeof turn.toolResult === "string" ? turn.toolResult : JSON.stringify(turn.toolResult),
              tool_call_id: `call_${Math.random().toString(36).substring(2, 9)}`,
            });
          }
        }
      }

      messages.push({ role: "user", content: input.userPrompt });

      const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature: input.temperature ?? config.temperature ?? 0.7,
        max_tokens: input.maxTokens ?? config.maxTokens ?? 2048,
      });

      const content = completion.choices[0]?.message?.content || "";
      const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0 };

      return {
        success: true,
        output: content,
        responseType: "FINAL_RESPONSE",
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
        },
        model,
        providerName: this.getProviderName(),
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Groq API error";
      return {
        success: false,
        output: "",
        responseType: "FINAL_RESPONSE",
        usage: { promptTokens: 0, completionTokens: 0 },
        model,
        providerName: this.getProviderName(),
        error: `[Groq API Error]: ${errorMsg}`,
      };
    }
  }
}
