/**
 * services/providers/claude-provider.ts
 *
 * Real Anthropic Claude Provider Implementation
 * Uses official @anthropic-ai/sdk to execute Claude messages API requests.
 * Reads API key from ANTHROPIC_API_KEY environment variable.
 */

import Anthropic from "@anthropic-ai/sdk";
import { BaseProvider } from "./base-provider";
import type { PromptInput, ProviderResponse, ModelInfo, ProviderConfig } from "./base-provider";

export class ClaudeProvider extends BaseProvider {
  getProviderName(): string {
    return "CLAUDE";
  }

  listAvailableModels(): ModelInfo[] {
    return [
      { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", contextWindow: 200000 },
      { id: "claude-3-opus-20240229", label: "Claude 3 Opus", contextWindow: 200000 },
      { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", contextWindow: 200000 },
    ];
  }

  validateConfiguration(config: ProviderConfig): boolean {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    return !!(config.provider && config.model && apiKey);
  }

  async executePrompt(input: PromptInput, config: ProviderConfig): Promise<ProviderResponse> {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    const model = config.model || "claude-3-5-sonnet-20241022";
    const history = input.history || [];

    // Fail explicitly if API Key is unconfigured in environment (No fake completions in Phase 2)
    if (!apiKey) {
      return {
        success: false,
        output: "",
        responseType: "FINAL_RESPONSE",
        usage: { promptTokens: 0, completionTokens: 0 },
        model,
        providerName: this.getProviderName(),
        error: "[Claude Error]: ANTHROPIC_API_KEY environment variable is missing. Real LLM provider execution failed.",
      };
    }

    // Real Claude API Call via official @anthropic-ai/sdk
    try {
      const anthropic = new Anthropic({
        apiKey,
        timeout: 30000,
      });

      const messages: Anthropic.MessageParam[] = [];

      for (const turn of history) {
        if (turn.role === "user") {
          messages.push({ role: "user", content: turn.content });
        } else if (turn.role === "assistant") {
          messages.push({ role: "assistant", content: turn.content });
        } else if (turn.role === "tool") {
          messages.push({
            role: "user",
            content: `Tool Execution Result (${turn.content}): ${
              typeof turn.toolResult === "object"
                ? JSON.stringify(turn.toolResult)
                : String(turn.toolResult)
            }`,
          });
        }
      }

      messages.push({ role: "user", content: input.userPrompt });

      const response = await anthropic.messages.create({
        model,
        system: input.systemPrompt || undefined,
        messages,
        max_tokens: config.maxTokens ?? 2048,
        temperature: config.temperature ?? 0.7,
      });

      const outputText = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n") || "No completion output received from Claude API.";

      return {
        success: true,
        output: outputText,
        responseType: "FINAL_RESPONSE",
        usage: {
          promptTokens: response.usage.input_tokens || 0,
          completionTokens: response.usage.output_tokens || 0,
        },
        model,
        providerName: this.getProviderName(),
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Claude API request failed";
      console.error("[CLAUDE SDK ERROR]:", errorMsg);

      return {
        success: false,
        output: `[Claude Error]: ${errorMsg}`,
        responseType: "FINAL_RESPONSE",
        usage: { promptTokens: 0, completionTokens: 0 },
        model,
        providerName: this.getProviderName(),
        error: errorMsg,
      };
    }
  }
}
