/**
 * app/api/product-seo/route.ts
 *
 * API Route Handler for Phase 5.1 Product SEO Engine.
 * POST /api/product-seo (Generates Product SEO Profile & Enqueues to Editorial)
 * GET  /api/product-seo?productId=... (Retrieves Product SEO Profile)
 */

import { NextResponse } from "next/server";
import { generateProductSEOProfile } from "@/services/product-seo/orchestrator";
import { getServerContext } from "@/lib/auth/get-server-context";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { productId, keyword, country = "IN", forceRefresh = false } = body;

    if (!productId || !keyword) {
      return NextResponse.json({ error: "Missing required 'productId' or 'keyword' parameters." }, { status: 400 });
    }

    const result = await generateProductSEOProfile(productId.trim(), keyword.trim(), country, forceRefresh);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Missing 'productId' query parameter." }, { status: 400 });
    }

    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") {
      return NextResponse.json({ error: "Database unavailable." }, { status: 500 });
    }

    const { data: profile } = await supabase
      .from("product_seo_profiles")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "No Product SEO Profile found for given productId." }, { status: 404 });
    }

    const [
      { data: benefits },
      { data: careGuides },
      { data: faqs },
      { data: schemas },
      { data: internalLinks },
      { data: imagePlan },
    ] = await Promise.all([
      supabase.from("product_benefits").select("*").eq("profile_id", profile.id).order("position", { ascending: true }),
      supabase.from("product_care_guides").select("*").eq("profile_id", profile.id).order("position", { ascending: true }),
      supabase.from("product_faqs").select("*").eq("profile_id", profile.id).order("position", { ascending: true }),
      supabase.from("product_schema").select("*").eq("profile_id", profile.id),
      supabase.from("product_internal_links").select("*").eq("profile_id", profile.id),
      supabase.from("product_image_plan").select("*").eq("profile_id", profile.id).order("position", { ascending: true }),
    ]);

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        benefits: benefits || [],
        careGuides: careGuides || [],
        faqs: faqs || [],
        schemas: (schemas || []).map((s: Record<string, unknown>) => s.schema_json),
        internalLinks: internalLinks || [],
        imagePlan: imagePlan || [],
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
