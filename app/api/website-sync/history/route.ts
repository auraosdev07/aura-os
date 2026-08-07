import { NextResponse } from "next/server";
import { getServerContext } from "@/lib/auth/get-server-context";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get("resourceId");

    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") {
      return NextResponse.json({ success: true, history: [] });
    }

    let query = supabase.from("sync_history").select("*").order("created_at", { ascending: false }).limit(30);
    if (resourceId) query = query.eq("resource_id", resourceId);

    const { data: history } = await query;
    return NextResponse.json({ success: true, history: history || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
