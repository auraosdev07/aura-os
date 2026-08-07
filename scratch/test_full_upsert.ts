import { getServerContext } from "@/lib/auth/get-server-context";

async function testFullUpsert() {
  const { supabase } = await getServerContext();
  const { data, error } = await supabase
    .from("seo_keyword_intelligence")
    .upsert(
      {
        keyword: "rose quartz bracelet",
        normalized_keyword: "rose quartz bracelet",
        country: "IN",
        intent: "INFORMATIONAL",
        intent_confidence: 0.9,
        active_providers: ["google-suggest"],
        total_signals_collected: 10,
        suggestions: [],
        questions: [],
        related_searches: [],
        community_discussions: [],
        serp_snapshot: [],
        modifiers: {},
        extracted_entities: [],
        mined_insights: {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "normalized_keyword,country" }
    )
    .select("id")
    .single();

  console.log("Full Upsert Result:", data, "Error:", error);
}

testFullUpsert();
