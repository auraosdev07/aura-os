/**
 * services/providers/openai-provider.ts
 *
 * Real OpenAI Provider Implementation
 * Uses official OpenAI Node.js SDK to execute Chat Completion calls with tool-calling support.
 * Reads API key from OPENAI_API_KEY environment variable.
 */

import OpenAI from "openai";
import { BaseProvider } from "./base-provider";
import type { PromptInput, ProviderResponse, ModelInfo, ProviderConfig } from "./base-provider";

export class OpenAIProvider extends BaseProvider {
  getProviderName(): string {
    return "OPENAI";
  }

  listAvailableModels(): ModelInfo[] {
    return [
      { id: "gpt-4o", label: "GPT-4o", contextWindow: 128000 },
      { id: "gpt-4o-mini", label: "GPT-4o Mini", contextWindow: 128000 },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo", contextWindow: 128000 },
    ];
  }

  validateConfiguration(config: ProviderConfig): boolean {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    return !!(config.provider && config.model && apiKey);
  }

  async executePrompt(input: PromptInput, config: ProviderConfig): Promise<ProviderResponse> {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    const model = config.model || "gpt-4o";
    const history = input.history || [];

    // Fail explicitly if API Key is not configured in environment (No fake completions in Phase 2)
    if (!apiKey) {
      return {
        success: false,
        output: "",
        responseType: "FINAL_RESPONSE",
        usage: { promptTokens: 0, completionTokens: 0 },
        model,
        providerName: this.getProviderName(),
        error: "[OpenAI Error]: OPENAI_API_KEY environment variable is missing. Real LLM provider execution failed.",
      };
    }

    // Real OpenAI API Call via official SDK
    try {
      const client = new OpenAI({
        apiKey,
        timeout: 30000, // 30s timeout
      });

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

      if (input.systemPrompt) {
        messages.push({ role: "system", content: input.systemPrompt });
      }

      // Add conversation history
      for (const turn of history) {
        if (turn.role === "user") {
          messages.push({ role: "user", content: turn.content });
        } else if (turn.role === "assistant") {
          messages.push({ role: "assistant", content: turn.content });
        } else if (turn.role === "tool") {
          messages.push({
            role: "user",
            content: `Tool Output (${turn.content}): ${
              typeof turn.toolResult === "object"
                ? JSON.stringify(turn.toolResult)
                : String(turn.toolResult)
            }`,
          });
        }
      }

      // Add current user prompt
      messages.push({ role: "user", content: input.userPrompt });

      const completion = await client.chat.completions.create({
        model,
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 2048,
      });

      const choice = completion.choices[0];
      const outputText = choice?.message?.content || "No completion response returned.";
      const usage = {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
      };

      return {
        success: true,
        output: outputText,
        responseType: "FINAL_RESPONSE",
        usage,
        model,
        providerName: this.getProviderName(),
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "OpenAI API request failed";
      console.error("[OPENAI SDK ERROR]:", errorMsg);

      return {
        success: false,
        output: `[OpenAI Error]: ${errorMsg}`,
        responseType: "FINAL_RESPONSE",
        usage: { promptTokens: 0, completionTokens: 0 },
        model,
        providerName: this.getProviderName(),
        error: errorMsg,
      };
    }
  }
}
