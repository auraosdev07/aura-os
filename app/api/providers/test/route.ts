import { NextResponse } from "next/server";
import { testProviderConnection } from "@/services/providers/provider-settings-service";
import { getProviderMetadata } from "@/services/providers/provider-metadata-registry";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const provider = body.provider as string;

    if (!provider || !getProviderMetadata(provider)) {
      return NextResponse.json({ success: false, message: `✗ Invalid or unregistered provider specified: '${provider}'.` }, { status: 400 });
    }

    const result = await testProviderConnection(provider);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Connection test error";
    return NextResponse.json({ success: false, message: `✗ Authentication Failed: ${errorMsg}` }, { status: 500 });
  }
}
