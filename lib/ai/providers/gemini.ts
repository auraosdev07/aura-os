/**
 * lib/ai/providers/gemini.ts
 *
 * Gemini provider implementation using native HTTP fetch with Web ReadableStream.
 */

import type {
  AIProvider,
  GenerateTextOptions,
  GenerateTextResult,
  GenerateJSONOptions,
  StreamTextOptions,
  HealthCheckResult,
} from "../types";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  private getApiKey(): string {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!key) {
      throw new Error(
        "Gemini API key is missing. Please set GEMINI_API_KEY in your environment variables."
      );
    }
    return key;
  }

  async listModels(): Promise<string[]> {
    return [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!key) {
      return {
        ok: false,
        provider: this.name,
        message: "GEMINI_API_KEY is not configured.",
        models: await this.listModels(),
      };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
      );
      if (response.ok) {
        return {
          ok: true,
          provider: this.name,
          message: "Gemini provider connected successfully.",
          models: await this.listModels(),
        };
      }
      const errJson = await response.json().catch(() => ({}));
      return {
        ok: false,
        provider: this.name,
        message: errJson.error?.message || `HTTP ${response.status}: Failed to authenticate with Gemini.`,
        models: await this.listModels(),
      };
    } catch (err: unknown) {
      return {
        ok: false,
        provider: this.name,
        message: err instanceof Error ? err.message : "Network error contacting Gemini API.",
        models: await this.listModels(),
      };
    }
  }

  private formatContents(messages: GenerateTextOptions["messages"]) {
    const contents: { role: string; parts: { text: string }[] }[] = [];
    let systemInstruction: { parts: { text: string }[] } | undefined = undefined;

    for (const msg of messages) {
      if (msg.role === "system") {
        systemInstruction = {
          parts: [{ text: msg.content }],
        };
      } else {
        const geminiRole = msg.role === "assistant" ? "model" : "user";
        contents.push({
          role: geminiRole,
          parts: [{ text: msg.content }],
        });
      }
    }

    return { contents, systemInstruction };
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const apiKey = this.getApiKey();
    const model = options.model || "gemini-1.5-flash";

    const { contents, systemInstruction } = this.formatContents(options.messages);

    const bodyPayload: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens,
      },
    };

    if (systemInstruction) {
      bodyPayload.systemInstruction = systemInstruction;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(
        errJson.error?.message || `Gemini API error: HTTP ${response.status}`
      );
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((p: { text: string }) => p.text).join("") || "";

    const promptTokens = data.usageMetadata?.promptTokenCount || 0;
    const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = data.usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

    return {
      text,
      model,
      provider: this.name,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
    };
  }

  async streamText(options: StreamTextOptions): Promise<ReadableStream<Uint8Array>> {
    const apiKey = this.getApiKey();
    const model = options.model || "gemini-1.5-flash";

    const { contents, systemInstruction } = this.formatContents(options.messages);

    const bodyPayload: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens,
      },
    };

    if (systemInstruction) {
      bodyPayload.systemInstruction = systemInstruction;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      }
    );

    if (!response.ok || !response.body) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(
        errJson.error?.message || `Gemini Stream error: HTTP ${response.status}`
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

              if (trimmed.startsWith("data: ")) {
                try {
                  const jsonStr = trimmed.substring(6);
                  const parsed = JSON.parse(jsonStr);
                  const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (textChunk) {
                    if (options.onChunk) {
                      options.onChunk(textChunk);
                    }
                    controller.enqueue(encoder.encode(textChunk));
                  }
                } catch {
                  // Ignore JSON parse errors for incomplete SSE lines
                }
              }
            }
          }

          if (buffer.length > 0) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith("data: ")) {
              try {
                const jsonStr = trimmed.substring(6);
                const parsed = JSON.parse(jsonStr);
                const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textChunk) {
                  if (options.onChunk) {
                    options.onChunk(textChunk);
                  }
                  controller.enqueue(encoder.encode(textChunk));
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
    const model = options.model || "gemini-1.5-flash";

    const { contents, systemInstruction } = this.formatContents(options.messages);

    const bodyPayload: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        responseMimeType: "application/json",
      },
    };

    if (systemInstruction) {
      bodyPayload.systemInstruction = systemInstruction;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(
        errJson.error?.message || `Gemini JSON API error: HTTP ${response.status}`
      );
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    try {
      return JSON.parse(rawText) as T;
    } catch {
      throw new Error(`Failed to parse Gemini JSON output: ${rawText}`);
    }
  }

  async embed(text: string | string[]): Promise<number[] | number[][]> {
    // Placeholder embedding vector (768-dimensional mock/zero vector)
    const count = Array.isArray(text) ? text.length : 1;
    const mockVector = new Array(768).fill(0);
    return count === 1 ? mockVector : new Array(count).fill(mockVector);
  }
}
