import { NextResponse } from "next/server";
import { evaluateContentQuality } from "@/services/qa-engine/orchestrator";
import type { QAInputPayload } from "@/services/qa-engine/types";
import { getServerContext } from "@/lib/auth/get-server-context";

export async function POST(req: Request) {
  try {
    const body: QAInputPayload = await req.json();
    if (!body.contentType || !body.resourceId) {
      return NextResponse.json(
        { success: false, error: "Missing contentType or resourceId" },
        { status: 400 }
      );
    }

    const report = await evaluateContentQuality(body);
    return NextResponse.json({ success: true, report });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get("resourceId");

    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") {
      return NextResponse.json({ success: true, reports: [] });
    }

    let query = supabase.from("qa_audit_reports").select("*").order("created_at", { ascending: false }).limit(20);
    if (resourceId) {
      query = query.eq("resource_id", resourceId);
    }

    const { data: reports } = await query;
    return NextResponse.json({ success: true, reports: reports || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
