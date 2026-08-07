import { NextResponse } from "next/server";
import { getKnowledgeEngineStats } from "@/services/knowledge-engine";
import type { KnowledgeCollectionType, KnowledgeDocumentStatus } from "@/types/knowledge-engine";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const typeStr = searchParams.get("type");
    const type = typeStr && typeStr !== "ALL" ? (typeStr as KnowledgeCollectionType) : undefined;

    const statusStr = searchParams.get("status");
    const status = statusStr && statusStr !== "ALL" ? (statusStr as KnowledgeDocumentStatus) : undefined;

    const collectionIdStr = searchParams.get("collectionId");
    const collectionId = collectionIdStr && collectionIdStr !== "ALL" ? collectionIdStr : undefined;

    const stats = await getKnowledgeEngineStats({
      type,
      status,
      collectionId,
    });

    return NextResponse.json({ success: true, stats });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load telemetry stats";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
