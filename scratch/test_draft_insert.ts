import { getServerContext } from "@/lib/auth/get-server-context";

async function testDraftInsert() {
  const { supabase } = await getServerContext();
  const { data, error } = await supabase
    .from("article_drafts")
    .insert({
      keyword: "test",
      normalized_keyword: "test",
      country: "IN",
      provider: "test",
      model: "test",
      version: 1,
      title: "test",
      meta_title: "test",
      meta_description: "test",
      slug: "test",
      introduction: "test",
      word_count: 100,
      validation_score: 90,
    })
    .select("id")
    .single();

  console.log("Insert Draft Result:", data, "Error:", error);
}

testDraftInsert();
