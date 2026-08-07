import { NextResponse } from "next/server";
import {
  getDocuments,
  createDocument,
} from "@/services/knowledge-engine";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const collectionId = searchParams.get("collectionId") || undefined;
    const search = searchParams.get("search") || undefined;

    const documents = await getDocuments({ collectionId, search });
    return NextResponse.json({ success: true, documents });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load documents";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { collectionId, title, source, rawContent, cleanContent, summary, tags, metadata, language } = body;

    if (!title || !rawContent) {
      return NextResponse.json({ success: false, error: "Title and raw content are required." }, { status: 400 });
    }

    const document = await createDocument({
      collectionId,
      title,
      source,
      rawContent,
      cleanContent,
      summary,
      tags,
      metadata,
      language,
    });

    return NextResponse.json({ success: true, document });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to create document";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
