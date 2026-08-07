/**
 * app/api/ai-writer/route.ts
 *
 * API Route Handler for Phase 4B.5A Universal AI Writer Engine.
 * POST /api/ai-writer (Generates or streams structured article draft)
 * GET  /api/ai-writer?keyword=... (Retrieves latest versioned draft)
 */

import { NextResponse } from "next/server";
import { generateArticleDraft } from "@/services/ai-writer/orchestrator";
import { getServerContext } from "@/lib/auth/get-server-context";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { keyword, country = "IN", provider = "heuristic-fallback", model = "default", forceRefresh = false } = body;

    if (!keyword || typeof keyword !== "string" || keyword.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid 'keyword' parameter in request body." },
        { status: 400 }
      );
    }

    const result = await generateArticleDraft(keyword.trim(), country, provider, model, forceRefresh);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[API /api/ai-writer POST ERROR]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate article draft." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword");
    const country = searchParams.get("country") || "IN";

    if (!keyword) {
      return NextResponse.json(
        { error: "Missing 'keyword' query parameter." },
        { status: 400 }
      );
    }

    const result = await generateArticleDraft(keyword.trim(), country, "heuristic-fallback", "default", false);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[API /api/ai-writer GET ERROR]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve article draft." },
      { status: 500 }
    );
  }
}
