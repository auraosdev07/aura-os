import { NextResponse } from "next/server";
import {
  listRegisteredProviders,
  getRegisteredProvider,
  getProviderConfig,
  setProviderConfig,
} from "@/services/providers";

export async function GET() {
  const config = getProviderConfig();
  const providers = listRegisteredProviders().map((name) => {
    const p = getRegisteredProvider(name);
    return {
      name,
      models: p ? p.listAvailableModels() : [],
    };
  });

  return NextResponse.json({
    activeConfig: config,
    registeredProviders: providers,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      provider?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };

    if (!body.provider) {
      return NextResponse.json({ error: "provider is required" }, { status: 400 });
    }

    const validProviders = listRegisteredProviders();
    if (!validProviders.includes(body.provider.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid provider. Valid options: ${validProviders.join(", ")}` },
        { status: 400 }
      );
    }

    setProviderConfig({
      provider: body.provider.toUpperCase(),
      ...(body.model && { model: body.model }),
      ...(body.temperature !== undefined && { temperature: body.temperature }),
      ...(body.maxTokens !== undefined && { maxTokens: body.maxTokens }),
    });

    return NextResponse.json({ success: true, activeConfig: getProviderConfig() });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
