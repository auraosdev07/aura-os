/**
 * app/api/content-strategy/route.ts
 *
 * API Route Handler for Phase 4B.4 SEO Content Strategy Engine.
 * POST /api/content-strategy (Generates structured SEO content brief)
 * GET  /api/content-strategy?keyword=... (Retrieves cached content brief)
 */

import { NextResponse } from "next/server";
import { generateContentBrief } from "@/services/content-strategy/content-strategy-orchestrator";
import { getServerContext } from "@/lib/auth/get-server-context";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { keyword, country = "IN", forceRefresh = false } = body;

    if (!keyword || typeof keyword !== "string" || keyword.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid 'keyword' parameter in request body." },
        { status: 400 }
      );
    }

    const brief = await generateContentBrief(keyword.trim(), country, forceRefresh);
    return NextResponse.json({ success: true, brief });
  } catch (err: any) {
    console.error("[API /api/content-strategy POST ERROR]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate SEO content brief." },
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

    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") {
      return NextResponse.json({ error: "Database unavailable." }, { status: 500 });
    }

    const { data: cached, error } = await supabase
      .from("content_briefs")
      .select("*")
      .ilike("normalized_keyword", `%${keyword.trim().toLowerCase()}%`)
      .eq("country", country.toUpperCase())
      .maybeSingle();

    if (error || !cached) {
      return NextResponse.json(
        { error: "No cached content brief found for specified keyword." },
        { status: 404 }
      );
    }

    const { data: sectionRows } = await supabase
      .from("content_brief_sections")
      .select("*")
      .eq("brief_id", cached.id)
      .order("position", { ascending: true });

    return NextResponse.json({
      success: true,
      brief: cached,
      sections: sectionRows || [],
    });
  } catch (err: any) {
    console.error("[API /api/content-strategy GET ERROR]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve content brief." },
      { status: 500 }
    );
  }
}
