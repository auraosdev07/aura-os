import { NextResponse } from "next/server";
import { searchKnowledgeEngine } from "@/services/knowledge-engine";
import type { KnowledgeCollectionType } from "@/types/knowledge-engine";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const collectionId = searchParams.get("collectionId") || undefined;
    const type = searchParams.get("type") as KnowledgeCollectionType | undefined;
    const status = searchParams.get("status") || undefined;
    const tagsStr = searchParams.get("tags");
    const tags = tagsStr ? tagsStr.split(",").filter(Boolean) : undefined;

    const results = await searchKnowledgeEngine({
      query,
      collectionId,
      type,
      status,
      tags,
    });

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to execute search";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
