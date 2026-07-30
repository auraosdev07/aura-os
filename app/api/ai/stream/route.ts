import { NextResponse, type NextRequest } from "next/server";
import { getServerContext } from "@/lib/auth/get-server-context";
import { streamText } from "@/lib/ai/client";
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

    const stream = await streamText(
      {
        messages,
        model,
        temperature,
      },
      provider
    );

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI streaming error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
