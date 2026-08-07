/**
 * services/providers/openrouter-provider.ts
 *
 * OpenRouter AI Provider Implementation
 * Routes LLM requests to any model on OpenRouter (Google, Anthropic, Meta, DeepSeek)
 * via OpenRouter's OpenAI-compatible endpoint.
 * Reads API key from OPENROUTER_API_KEY environment variable.
 */

import OpenAI from "openai";
import {
  BaseProvider,
  type PromptInput,
  type ProviderConfig,
  type ProviderResponse,
  type ModelInfo,
} from "./base-provider";

export class OpenRouterProvider extends BaseProvider {
  getProviderName(): string {
    return "OPENROUTER";
  }

  listAvailableModels(): ModelInfo[] {
    return [
      { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash (OpenRouter)", contextWindow: 1000000 },
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet (OpenRouter)", contextWindow: 200000 },
      { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B (OpenRouter)", contextWindow: 128000 },
      { id: "deepseek/deepseek-r1", label: "DeepSeek R1 (OpenRouter)", contextWindow: 128000 },
    ];
  }

  validateConfiguration(config: ProviderConfig): boolean {
    const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
    return !!(apiKey && apiKey.trim().length > 0);
  }

  async executePrompt(input: PromptInput, config: ProviderConfig): Promise<ProviderResponse> {
    const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
    const model = config.model || input.model || "google/gemini-2.0-flash-001";

    if (!apiKey || apiKey.trim().length === 0) {
      return {
        success: false,
        output: "",
        responseType: "FINAL_RESPONSE",
        usage: { promptTokens: 0, completionTokens: 0 },
        model,
        providerName: this.getProviderName(),
        error: "[OpenRouter Error]: OPENROUTER_API_KEY environment variable is missing.",
      };
    }

    try {
      const openrouter = new OpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://aura-os.dev",
          "X-Title": "Aura OS",
        },
        timeout: 30000,
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

      const completion = await openrouter.chat.completions.create({
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
      const errorMsg = err instanceof Error ? err.message : "OpenRouter API error";
      return {
        success: false,
        output: "",
        responseType: "FINAL_RESPONSE",
        usage: { promptTokens: 0, completionTokens: 0 },
        model,
        providerName: this.getProviderName(),
        error: `[OpenRouter API Error]: ${errorMsg}`,
      };
    }
  }
}
