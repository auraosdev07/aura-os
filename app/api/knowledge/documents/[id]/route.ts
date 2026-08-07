import { NextResponse } from "next/server";
import {
  getDocumentById,
  updateDocument,
  deleteDocument,
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
      return NextResponse.json({ success: false, error: "Missing document ID parameter" }, { status: 400 });
    }
    const document = await getDocumentById(id);
    if (!document) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, document });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load document";
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
      return NextResponse.json({ success: false, error: "Missing document ID parameter" }, { status: 400 });
    }
    const body = await req.json();
    const document = await updateDocument(id, body);
    return NextResponse.json({ success: true, document });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to update document";
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
      return NextResponse.json({ success: false, error: "Missing document ID parameter" }, { status: 400 });
    }
    await deleteDocument(id);
    return NextResponse.json({ success: true, message: "Document deleted successfully" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to delete document";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
