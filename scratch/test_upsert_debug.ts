import { getServerContext } from "@/lib/auth/get-server-context";

async function testUpsert() {
  const { supabase } = await getServerContext();
  const { data, error } = await supabase
    .from("seo_keyword_intelligence")
    .upsert(
      {
        keyword: "test",
        normalized_keyword: "test",
        country: "IN",
        intent: "INFORMATIONAL",
        intent_confidence: 0.9,
      },
      { onConflict: "normalized_keyword,country" }
    )
    .select("id")
    .single();

  console.log("Data:", data, "Error:", error);
}

testUpsert();
