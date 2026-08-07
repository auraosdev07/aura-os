import { NextResponse } from "next/server";
import {
  getProviderSettings,
  getEnrichedProviderCards,
  getSystemAiConfig,
  setDefaultProvider,
  toggleEnableFallback,
  updateProviderModel,
  reorderProvidersPriority,
} from "@/services/providers/provider-settings-service";

export async function GET() {
  try {
    const [providers, enrichedCards, config] = await Promise.all([
      getProviderSettings(),
      getEnrichedProviderCards(),
      getSystemAiConfig(),
    ]);
    return NextResponse.json({ success: true, providers, enrichedCards, config });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load provider settings";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, provider, model, apiKey, enable, isEnabled, orderedProviderIds } = body;

    if (action === "setDefault") {
      await setDefaultProvider(provider);
    } else if (action === "toggleFallback") {
      await toggleEnableFallback(Boolean(enable));
    } else if (action === "updateModel") {
      await updateProviderModel(provider, model as string, apiKey as string, undefined, isEnabled);
    } else if (action === "reorderPriority") {
      if (Array.isArray(orderedProviderIds)) {
        await reorderProvidersPriority(orderedProviderIds);
      }
    } else if (action === "toggleEnabled") {
      await updateProviderModel(provider, model || "default", undefined, undefined, Boolean(isEnabled));
    } else {
      return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }

    const [providers, enrichedCards, config] = await Promise.all([
      getProviderSettings(),
      getEnrichedProviderCards(),
      getSystemAiConfig(),
    ]);
    return NextResponse.json({ success: true, providers, enrichedCards, config });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to update provider settings";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
