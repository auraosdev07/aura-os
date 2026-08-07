import { NextResponse } from "next/server";
import { getServerContext } from "@/lib/auth/get-server-context";

export async function GET() {
  try {
    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from !== "function") {
      return NextResponse.json({
        success: true,
        providers: [
          { id: "google_trends", name: "Google Trends Adapter", category: "SEARCH_ENGINE", is_enabled: true },
          { id: "google_autocomplete", name: "Google Autocomplete Adapter", category: "SEARCH_ENGINE", is_enabled: true },
          { id: "pinterest", name: "Pinterest Visual Trends Adapter", category: "SOCIAL", is_enabled: true },
          { id: "reddit", name: "Reddit Community Sentiment Adapter", category: "COMMUNITY", is_enabled: true },
          { id: "youtube", name: "YouTube Video Search Trends Adapter", category: "MEDIA", is_enabled: true },
          { id: "instagram", name: "Instagram Social Engagement Adapter", category: "SOCIAL", is_enabled: true },
          { id: "amazon", name: "Amazon Bestseller Trends Adapter", category: "ECOMMERCE", is_enabled: true },
          { id: "etsy", name: "Etsy Handmade Jewelry Adapter", category: "ECOMMERCE", is_enabled: true },
          { id: "quora", name: "Quora Intent & Question Adapter", category: "COMMUNITY", is_enabled: true },
        ],
      });
    }

    const { data: providers } = await supabase.from("trend_providers").select("*");
    return NextResponse.json({ success: true, providers: providers || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
