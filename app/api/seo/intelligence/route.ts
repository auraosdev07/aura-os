/**
 * app/api/seo/intelligence/route.ts
 *
 * API Route for Universal SEO Intelligence Layer (Phase 4B.2).
 * POST: Runs providers, stores raw signals, normalizes, upserts DB & Knowledge Engine, returns report.
 * GET: Returns cached intelligence for given keyword & country.
 */

import { NextResponse } from "next/server";
import { getSEOIntelligence } from "@/services/seo-intelligence/orchestrator";
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

    const report = await getSEOIntelligence(keyword.trim(), country, forceRefresh);
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    console.error("[API /api/seo/intelligence POST ERROR]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate SEO intelligence." },
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
      .from("seo_keyword_intelligence")
      .select("*")
      .ilike("normalized_keyword", `%${keyword.trim().toLowerCase()}%`)
      .eq("country", country.toUpperCase())
      .maybeSingle();

    if (error || !cached) {
      return NextResponse.json(
        { error: "No cached SEO intelligence found for specified keyword." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, report: cached });
  } catch (err: any) {
    console.error("[API /api/seo/intelligence GET ERROR]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve cached SEO intelligence." },
      { status: 500 }
    );
  }
}
