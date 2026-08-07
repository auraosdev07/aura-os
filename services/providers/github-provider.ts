/**
 * services/providers/github-provider.ts
 *
 * GitHub Models AI Provider Implementation
 * Routes requests to GitHub Models (GPT-4o, Phi-3, Llama 3) via GitHub's Azure OpenAI inference endpoint.
 * Reads API key from GITHUB_TOKEN or GITHUB_MODELS_API_KEY environment variable.
 */

import OpenAI from "openai";
import {
  BaseProvider,
  type PromptInput,
  type ProviderConfig,
  type ProviderResponse,
  type ModelInfo,
} from "./base-provider";

export class GitHubProvider extends BaseProvider {
  getProviderName(): string {
    return "GITHUB";
  }

  listAvailableModels(): ModelInfo[] {
    return [
      { id: "gpt-4o", label: "GPT-4o (GitHub Models)", contextWindow: 128000 },
      { id: "gpt-4o-mini", label: "GPT-4o Mini (GitHub Models)", contextWindow: 128000 },
      { id: "Phi-3-medium-128k-instruct", label: "Phi-3 Medium 128k (GitHub)", contextWindow: 128000 },
    ];
  }

  validateConfiguration(config: ProviderConfig): boolean {
    const apiKey = config.apiKey || process.env.GITHUB_MODELS_API_KEY || process.env.GITHUB_TOKEN;
    return !!(apiKey && apiKey.trim().length > 0);
  }

  async executePrompt(input: PromptInput, config: ProviderConfig): Promise<ProviderResponse> {
    const apiKey =
      config.apiKey || process.env.GITHUB_MODELS_API_KEY || process.env.GITHUB_TOKEN;
    const model = config.model || input.model || "gpt-4o";

    if (!apiKey || apiKey.trim().length === 0) {
      return {
        success: false,
        output: "",
        responseType: "FINAL_RESPONSE",
        usage: { promptTokens: 0, completionTokens: 0 },
        model,
        providerName: this.getProviderName(),
        error: "[GitHub Models Error]: GITHUB_MODELS_API_KEY or GITHUB_TOKEN environment variable is missing.",
      };
    }

    try {
      const github = new OpenAI({
        apiKey,
        baseURL: "https://models.inference.ai.azure.com",
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

      const completion = await github.chat.completions.create({
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
      const errorMsg = err instanceof Error ? err.message : "GitHub Models API error";
      return {
        success: false,
        output: "",
        responseType: "FINAL_RESPONSE",
        usage: { promptTokens: 0, completionTokens: 0 },
        model,
        providerName: this.getProviderName(),
        error: `[GitHub Models API Error]: ${errorMsg}`,
      };
    }
  }
}
