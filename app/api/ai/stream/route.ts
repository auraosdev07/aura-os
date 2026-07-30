import { NextResponse, type NextRequest } from "next/server";
import { getServerContext } from "@/lib/auth/get-server-context";
import { streamText } from "@/lib/ai/client";
import { retrieveContext } from "@/lib/rag/retriever";
import type { AIMessage } from "@/lib/ai/types";

export async function POST(req: NextRequest) {
  try {
    await getServerContext();

    const body = await req.json();
    const { messages, provider, model, temperature } = body as {
      messages: AIMessage[];
      provider?: string;
      model?: string;
      temperature?: number;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required." },
        { status: 400 }
      );
    }

    // Retrieve RAG context safely before starting the stream
    const lastUserMessage = messages.filter((m) => m.role === "user").slice(-1)[0]?.content || "";
    let ragStatus: "Enabled" | "None" | "Error" = "None";
    let retrievedChunkCount = 0;
    let retrievedTokenCount = 0;
    let retrievalLatencyMs = 0;
    let formattedContext = "";

    try {
      const retrievalStart = Date.now();
      if (lastUserMessage.trim()) {
        const contextRes = await retrieveContext({
          query: lastUserMessage,
          maxTokens: 2000,
        });
        retrievalLatencyMs = Date.now() - retrievalStart;
        retrievedChunkCount = contextRes.chunks.length;
        retrievedTokenCount = contextRes.totalTokens;

        if (contextRes.chunks.length > 0) {
          ragStatus = "Enabled";
          formattedContext = contextRes.formattedContext;
        }
      }
    } catch (err) {
      console.error("[RAG RETRIEVAL ERROR in stream route]:", err);
      ragStatus = "Error";
    }

    console.log("[RAG RETRIEVAL LOG]", {
      chunkCount: retrievedChunkCount,
      tokenCount: retrievedTokenCount,
      latencyMs: retrievalLatencyMs,
      status: ragStatus,
    });

    // Append retrieved context safely to existing system message without overwriting
    const updatedMessages = [...messages];
    if (formattedContext) {
      const sysMsgIndex = updatedMessages.findIndex((m) => m.role === "system");
      if (sysMsgIndex !== -1) {
        updatedMessages[sysMsgIndex] = {
          ...updatedMessages[sysMsgIndex],
          content: `${updatedMessages[sysMsgIndex].content}\n\n${formattedContext}`,
        };
      } else {
        updatedMessages.unshift({
          role: "system",
          content: formattedContext,
        });
      }
    }

    const stream = await streamText(
      {
        messages: updatedMessages,
        model,
        temperature,
      },
      provider
    );

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
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
