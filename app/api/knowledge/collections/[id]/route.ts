import { NextResponse } from "next/server";
import {
  getCollectionById,
  updateCollection,
  deleteCollection,
} from "@/services/knowledge-engine";

async function extractId(context: { params: Promise<{ id: string }> | { id: string } }): Promise<string> {
  if (!context || !context.params) return "";
  const params = await (context.params instanceof Promise ? context.params : Promise.resolve(context.params));
  return params?.id || "";
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const id = await extractId(context);
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing collection ID parameter" }, { status: 400 });
    }
    const collection = await getCollectionById(id);
    if (!collection) {
      return NextResponse.json({ success: false, error: "Collection not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, collection });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load collection";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const id = await extractId(context);
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing collection ID parameter" }, { status: 400 });
    }
    const body = await req.json();
    const collection = await updateCollection(id, body);
    return NextResponse.json({ success: true, collection });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to update collection";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const id = await extractId(context);
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing collection ID parameter" }, { status: 400 });
    }
    await deleteCollection(id);
    return NextResponse.json({ success: true, message: "Collection deleted successfully" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to delete collection";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
