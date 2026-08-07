/**
 * app/api/topic-intelligence/route.ts
 *
 * API Route Handler for Phase 4B.3 Topic Intelligence Engine.
 * POST /api/topic-intelligence (Builds entire topic graph)
 * GET  /api/topic-intelligence (Returns clusters, authority, relationships, content gaps, internal links)
 */

import { NextResponse } from "next/server";
import { generateTopicIntelligence } from "@/services/topic-intelligence/orchestrator";
import { getServerContext } from "@/lib/auth/get-server-context";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const country = body.country || "IN";

    const result = await generateTopicIntelligence(country);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("[API /api/topic-intelligence POST ERROR]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate topic intelligence." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") {
      return NextResponse.json({ error: "Database unavailable." }, { status: 500 });
    }

    const [
      { data: clusters },
      { data: nodes },
      { data: edges },
      { data: contentGaps },
      { data: internalLinks },
    ] = await Promise.all([
      supabase.from("topic_clusters").select("*, keywords:topic_cluster_keywords(*)"),
      supabase.from("topic_graph_nodes").select("*").limit(100),
      supabase.from("topic_graph_edges").select("*").limit(100),
      supabase.from("content_gaps").select("*"),
      supabase.from("internal_link_recommendations").select("*"),
    ]);

    return NextResponse.json({
      success: true,
      clusters: clusters || [],
      nodesCount: nodes?.length || 0,
      edgesCount: edges?.length || 0,
      contentGaps: contentGaps || [],
      internalLinks: internalLinks || [],
    });
  } catch (err: any) {
    console.error("[API /api/topic-intelligence GET ERROR]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve topic intelligence." },
      { status: 500 }
    );
  }
}
