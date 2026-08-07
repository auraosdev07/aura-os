/**
 * app/api/editor/review/route.ts
 */

import { NextResponse } from "next/server";
import { getServerContext } from "@/lib/auth/get-server-context";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queueId = searchParams.get("queueId");

    if (!queueId) {
      return NextResponse.json({ error: "Missing queueId query parameter." }, { status: 400 });
    }

    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") {
      return NextResponse.json({ error: "Database unavailable." }, { status: 500 });
    }

    const { data: queueItem } = await supabase.from("editorial_queue").select("*").eq("id", queueId).single();
    if (!queueItem) {
      return NextResponse.json({ error: "Queue item not found." }, { status: 404 });
    }

    const [
      { data: draft },
      { data: sections },
      { data: meta },
      { data: images },
      { data: links },
      { data: reviews },
    ] = await Promise.all([
      supabase.from("article_drafts").select("*").eq("id", queueItem.draft_id).single(),
      supabase.from("article_sections").select("*").eq("draft_id", queueItem.draft_id).order("position", { ascending: true }),
      supabase.from("article_metadata").select("*").eq("draft_id", queueItem.draft_id).maybeSingle(),
      supabase.from("article_images").select("*").eq("draft_id", queueItem.draft_id),
      supabase.from("article_internal_links").select("*").eq("draft_id", queueItem.draft_id),
      supabase.from("editorial_reviews").select("*").eq("queue_id", queueId).order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      success: true,
      review: {
        queueItem,
        draft: draft || {},
        sections: sections || [],
        metadata: meta || {},
        images: images || [],
        internalLinks: links || [],
        reviews: reviews || [],
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
