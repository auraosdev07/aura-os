import { NextResponse, type NextRequest } from "next/server";
import { getServerContext } from "@/lib/auth/get-server-context";
import type { AIMessage } from "@/lib/ai/types";
import { aiRegistry } from "@/lib/ai/registry";
import { runAgentLoop } from "@/lib/ai/agent/loop";
import { aiToolRegistry } from "@/lib/ai/tools/registry";
import type { ToolContext } from "@/lib/ai/tools/types";
import { generatePlan } from "@/lib/ai/planner/planner";
import { evaluateAndWriteMemory } from "@/lib/ai/memory/memory-writer";
import { fetchWithGeminiFallback } from "@/lib/ai/providers/gemini-fallback";
import { managerEngine } from "@/lib/ai/manager/manager";
import { buildUnifiedContextPackage } from "@/lib/ai/memory/context-builder";
import {
  getOrCreateConversation,
  appendUserMessage,
  appendAssistantMessage,
} from "@/services/conversation";
import "@/lib/ai/tools/definitions"; // Bootstrap all domain tools into AIToolRegistry

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await getServerContext();

    const body = await req.json();
    const { messages, provider, model, temperature, conversationId: reqConvId } = body as {
      messages: AIMessage[];
      provider?: string;
      model?: string;
      temperature?: number;
      conversationId?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required." },
        { status: 400 }
      );
    }

    const lastUserMessage = messages.filter((m) => m.role === "user").slice(-1)[0]?.content || "";

    // Build Unified Context Package using parallel retrieval & token budgeting
    const contextPkg = await buildUnifiedContextPackage({
      ownerId: user.id,
      query: lastUserMessage,
      messages,
      conversationId: reqConvId,
      supabaseOverride: supabase,
    });

    const updatedMessages = contextPkg.messages;
    const ragStatus: "Enabled" | "None" | "Error" = contextPkg.stats.ragChunks > 0 ? "Enabled" : "None";
    const retrievedChunkCount = contextPkg.stats.ragChunks;
    const retrievedTokenCount = contextPkg.stats.totalTokens;

    const activeProviderName = (provider || aiRegistry.getActiveProviderName()).toLowerCase();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let streamClosed = false;

        const closeStream = () => {
          if (streamClosed) return;
          streamClosed = true;
          try {
            controller.close();
          } catch {
            // Ignore
          }
        };

        const sendSSE = (eventData: Record<string, unknown>) => {
          if (streamClosed) return;
          try {
            const payload = `data: ${JSON.stringify(eventData)}\n\n`;
            controller.enqueue(encoder.encode(payload));
          } catch {
            // Ignore enqueue errors if client disconnected
          }
        };

        const toolContext: ToolContext = {
          ownerId: user.id,
          onToolStart: ({ callId, toolName }) => {
            sendSSE({ type: "tool_start", callId, toolName });
          },
          onToolComplete: ({ callId, toolName, status, executionTimeMs }) => {
            sendSSE({ type: "tool_complete", callId, toolName, status, executionTimeMs });
          },
          onToolError: ({ callId, toolName, error }) => {
            sendSSE({ type: "tool_error", callId, toolName, error });
          },
        };

        const enabledToolDefs = aiToolRegistry.getEnabledToolDefinitions(toolContext);

        try {
          // Check Manager Engine for specialized multi-agent routing
          const managerResult = await managerEngine.processRequest({
            userQuery: lastUserMessage,
            messages: updatedMessages,
            provider: activeProviderName,
            model,
            context: toolContext,
          });

          if (managerResult) {
            sendSSE({
              type: "assistant_chunk",
              text: managerResult.mergedText,
            });
            sendSSE({
              type: "assistant_complete",
              text: managerResult.mergedText,
            });
            return;
          }

          const providerCallFn = async (
            loopMessages: AIMessage[],
            formattedTools?: unknown[]
          ): Promise<{ text: string; rawResponse?: unknown }> => {
            if (activeProviderName === "openai") {
              const apiKey = process.env.OPENAI_API_KEY;
              if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
              const modelName = model || process.env.OPENAI_MODEL || "gpt-4o-mini";

              const bodyObj: Record<string, unknown> = {
                model: modelName,
                messages: loopMessages.map((m) => ({ role: m.role, content: m.content })),
                temperature: temperature ?? 0.7,
              };
              if (formattedTools && formattedTools.length > 0) {
                bodyObj.tools = formattedTools;
              }

              const url = "https://api.openai.com/v1/chat/completions";
              const res = await fetch(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(bodyObj),
              });

              const raw = await res.text();

              if (!res.ok) {
                let errMessage = `OpenAI API error: HTTP ${res.status}`;
                try {
                  const errJson = JSON.parse(raw);
                  errMessage = errJson.error?.message || errMessage;
                } catch {
                  // Ignore
                }
                throw new Error(errMessage);
              }

              const data = JSON.parse(raw);
              const text = data.choices?.[0]?.message?.content || "";
              return { text, rawResponse: data };
            } else {
              const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
              if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

              const contents: { role: string; parts: { text: string }[] }[] = [];
              let systemInstruction: { parts: { text: string }[] } | undefined = undefined;

              for (const msg of loopMessages) {
                if (msg.role === "system") {
                  systemInstruction = { parts: [{ text: msg.content }] };
                } else {
                  const geminiRole = msg.role === "assistant" ? "model" : "user";
                  contents.push({
                    role: geminiRole,
                    parts: [{ text: msg.content }],
                  });
                }
              }

              const bodyObj: Record<string, unknown> = { contents };
              if (systemInstruction) bodyObj.systemInstruction = systemInstruction;
              if (formattedTools && formattedTools.length > 0) {
                bodyObj.tools = formattedTools;
              }

              const { response: res } = await fetchWithGeminiFallback({
                apiKey,
                endpointSuffix: ":generateContent",
                fetchOptions: {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(bodyObj),
                },
                requestedModel: model,
              });

              const data = await res.json();
              const candidate = data.candidates?.[0];
              const parts = candidate?.content?.parts || [];
              const textPart = parts.find((p: Record<string, unknown>) => typeof p.text === "string");
              const text = textPart ? textPart.text : "";

              return { text, rawResponse: data };
            }
          };

          const plan = await generatePlan({
            userQuery: lastUserMessage,
            availableTools: enabledToolDefs.map((t) => ({
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            })),
            memories: [],
            provider: activeProviderName === "openai" ? "openai" : "gemini",
            model,
          });

          const effectiveToolDefs = plan.requiresTools ? enabledToolDefs : [];

          const loopResult = await runAgentLoop({
            messages: updatedMessages,
            provider: activeProviderName === "openai" ? "openai" : "gemini",
            toolDefinitions: effectiveToolDefs,
            context: toolContext,
            maxIterations: 5,
            providerCallFn,
          });

          const finalText = loopResult.finalText || loopResult.text || "";

          // Persist user turn and assistant response
          let activeConvId = reqConvId;
          try {
            const conv = await getOrCreateConversation(reqConvId);
            activeConvId = conv.id;
            if (lastUserMessage.trim()) {
              await appendUserMessage(conv.id, lastUserMessage);
            }
          } catch (convErr) {
            if (process.env.NODE_ENV !== "production") {
              console.error("[CONVERSATION SAVE USER MSG ERROR]:", convErr);
            }
          }

          if (finalText) {
            sendSSE({
              type: "assistant_chunk",
              text: finalText,
            });
          }

          sendSSE({
            type: "assistant_complete",
            text: finalText,
            conversationId: activeConvId,
            iterationCount: loopResult.iterationCount,
            stopReason: loopResult.stopReason,
          });

          if (activeConvId && finalText.trim()) {
            appendAssistantMessage(activeConvId, finalText).catch((err) => {
              if (process.env.NODE_ENV !== "production") {
                console.error("[CONVERSATION SAVE ASSISTANT MSG ERROR]:", err);
              }
            });
          }

          evaluateAndWriteMemory({
            ownerId: user.id,
            userQuery: lastUserMessage,
            assistantResponse: finalText,
          }).catch(() => {});
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : "AI streaming error occurred.";
          sendSSE({
            type: "assistant_complete",
            text: `⚠️ Error: ${errorMsg}`,
            iterationCount: 0,
            stopReason: "provider_error",
          });
        } finally {
          closeStream();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-RAG-Status": ragStatus,
        "X-RAG-Chunks": String(retrievedChunkCount),
        "X-RAG-Tokens": String(retrievedTokenCount),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI streaming error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
