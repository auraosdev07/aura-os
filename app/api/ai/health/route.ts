import { NextResponse } from "next/server";
import { resolveGeminiModel } from "@/lib/ai/providers/gemini-fallback";

export async function GET() {
  const workingModel = resolveGeminiModel();

  return NextResponse.json({
    provider: "gemini",
    workingModel,
    status: "healthy",
  });
}
