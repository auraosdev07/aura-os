import { NextResponse } from "next/server";
import {
  getCollections,
  createCollection,
} from "@/services/knowledge-engine";
import type { KnowledgeCollectionType } from "@/types/knowledge-engine";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as KnowledgeCollectionType | undefined;
    const search = searchParams.get("search") || undefined;

    const collections = await getCollections({ type, search });
    return NextResponse.json({ success: true, collections });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load collections";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, type, tags, metadata } = body;

    if (!name || !type) {
      return NextResponse.json({ success: false, error: "Name and type are required." }, { status: 400 });
    }

    const collection = await createCollection({
      name,
      description,
      type,
      tags,
      metadata,
    });

    return NextResponse.json({ success: true, collection });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to create collection";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
