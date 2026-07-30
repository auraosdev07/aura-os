/**
 * lib/ai/providers/openai.ts
 *
 * OpenAI provider implementation using native HTTP fetch with Web ReadableStream.
 */

import type {
  AIProvider,
  GenerateTextOptions,
  GenerateTextResult,
  GenerateJSONOptions,
  StreamTextOptions,
  HealthCheckResult,
} from "../types";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  private getApiKey(): string {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        "OpenAI API key is missing. Please set OPENAI_API_KEY in your environment variables."
      );
    }
    return key;
  }

  async listModels(): Promise<string[]> {
    return [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-3.5-turbo",
    ];
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return {
        ok: false,
        provider: this.name,
        message: "OPENAI_API_KEY is not configured.",
        models: await this.listModels(),
      };
    }

    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (response.ok) {
        return {
          ok: true,
          provider: this.name,
          message: "OpenAI provider connected successfully.",
          models: await this.listModels(),
        };
      }
      const errJson = await response.json().catch(() => ({}));
      return {
        ok: false,
        provider: this.name,
        message: errJson.error?.message || `HTTP ${response.status}: Failed to authenticate with OpenAI.`,
        models: await this.listModels(),
      };
    } catch (err: unknown) {
      return {
        ok: false,
        provider: this.name,
        message: err instanceof Error ? err.message : "Network error contacting OpenAI API.",
        models: await this.listModels(),
      };
    }
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const apiKey = this.getApiKey();
    const model = options.model || "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: options.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(
        errJson.error?.message || `OpenAI API error: HTTP ${response.status}`
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const text = choice?.message?.content || "";

    return {
      text,
      model,
      provider: this.name,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
          }
        : undefined,
    };
  }

  async streamText(options: StreamTextOptions): Promise<ReadableStream<Uint8Array>> {
    const apiKey = this.getApiKey();
    const model = options.model || "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: options.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(
        errJson.error?.message || `OpenAI Stream error: HTTP ${response.status}`
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = response.body.getReader();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(":")) continue;

              if (trimmed === "data: [DONE]") {
                controller.close();
                return;
              }

              if (trimmed.startsWith("data: ")) {
                try {
                  const jsonStr = trimmed.substring(6);
                  const parsed = JSON.parse(jsonStr);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    if (options.onChunk) {
                      options.onChunk(delta);
                    }
                    controller.enqueue(encoder.encode(delta));
                  }
                } catch {
                  // Ignore JSON parse errors for incomplete SSE lines
                }
              }
            }
          }

          if (buffer.length > 0) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
              try {
                const jsonStr = trimmed.substring(6);
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  if (options.onChunk) {
                    options.onChunk(delta);
                  }
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                // Ignore parsing leftover buffer
              }
            }
          }

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }

  async generateJSON<T = unknown>(options: GenerateJSONOptions): Promise<T> {
    const apiKey = this.getApiKey();
    const model = options.model || "gpt-4o-mini";

    const systemPrompt = options.schema
      ? `Respond ONLY with a valid JSON object adhering to this JSON Schema:\n${JSON.stringify(options.schema)}`
      : "Respond ONLY with a valid JSON object.";

    const messages = [
      { role: "system", content: systemPrompt },
      ...options.messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(
        errJson.error?.message || `OpenAI JSON API error: HTTP ${response.status}`
      );
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || "{}";

    try {
      return JSON.parse(rawText) as T;
    } catch {
      throw new Error(`Failed to parse OpenAI JSON output: ${rawText}`);
    }
  }

  async embed(text: string | string[]): Promise<number[] | number[][]> {
    // Placeholder embedding vector (1536-dimensional mock/zero vector)
    const count = Array.isArray(text) ? text.length : 1;
    const mockVector = new Array(1536).fill(0);
    return count === 1 ? mockVector : new Array(count).fill(mockVector);
  }
}
