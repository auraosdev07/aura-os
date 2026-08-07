import { NextResponse } from "next/server";
import { getAllProviderMetadata } from "@/services/providers/provider-metadata-registry";

export async function GET() {
  try {
    const metadata = getAllProviderMetadata();
    return NextResponse.json({ success: true, metadata });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load provider registry metadata";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
