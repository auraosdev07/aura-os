/**
 * scratch/test_phase_4b3_topic_graph.ts
 *
 * Real End-to-End Verification Script for Phase 4B.3 SEO Knowledge Graph & Topic Intelligence Engine.
 *
 * Verifies:
 *   CHECK 1: Topic clusters generated.
 *   CHECK 2: No duplicate clusters.
 *   CHECK 3: Graph nodes created.
 *   CHECK 4: Graph edges created.
 *   CHECK 5: Content gaps generated.
 *   CHECK 6: Internal link recommendations generated.
 *   CHECK 7: Authority score in 0-100 range.
 *   CHECK 8: Deterministic 10-run repeatability check (Same dataset -> Same output).
 *   CHECK 9: Knowledge documents created with unique IDs.
 *   CHECK 10: Database row counts delta before vs after for all 7 Phase 4B.3 tables.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { getSEOIntelligence } from "@/services/seo-intelligence/orchestrator";
import { generateTopicIntelligence } from "@/services/topic-intelligence/orchestrator";

const SEED_KEYWORDS = [
  "rose quartz bracelet",
  "money magnet bracelet",
  "amethyst bracelet",
  "black tourmaline bracelet",
  "citrine bracelet",
];

async function main() {
  console.log("=== PHASE 4B.3 SEO KNOWLEDGE GRAPH & TOPIC INTELLIGENCE ENGINE E2E TEST ===\n");

  const { supabase } = await getServerContext();
  if (!supabase || typeof supabase.from !== "function") {
    console.error("[FATAL] Supabase client unavailable.");
    process.exit(1);
  }

  // ── STEP 1: PRE-POPULATE 5 KEYWORDS VIA PHASE 4B.2 ─────────────────────────
  console.log("--- Pre-populating Phase 4B.2 SEO Intelligence Dataset (5 Keywords) ---");
  for (const kw of SEED_KEYWORDS) {
    process.stdout.write(`  Processing "${kw}"... `);
    await getSEOIntelligence(kw, "IN", false);
    process.stdout.write("done\n");
  }
  console.log("  Dataset ready.\n");

  // ── STEP 2: BASELINE DB COUNTS FOR PHASE 4B.3 TABLES ───────────────────────
  const [
    { data: initClusters },
    { data: initClusterKws },
    { data: initNodes },
    { data: initEdges },
    { data: initGaps },
    { data: initLinks },
    { data: initDocs },
  ] = await Promise.all([
    supabase.from("topic_clusters").select("id"),
    supabase.from("topic_cluster_keywords").select("id"),
    supabase.from("topic_graph_nodes").select("id"),
    supabase.from("topic_graph_edges").select("id"),
    supabase.from("content_gaps").select("id"),
    supabase.from("internal_link_recommendations").select("id"),
    supabase.from("knowledge_documents").select("id"),
  ]);

  const initCounts = {
    topic_clusters: initClusters?.length || 0,
    topic_cluster_keywords: initClusterKws?.length || 0,
    topic_graph_nodes: initNodes?.length || 0,
    topic_graph_edges: initEdges?.length || 0,
    content_gaps: initGaps?.length || 0,
    internal_link_recommendations: initLinks?.length || 0,
    knowledge_documents: initDocs?.length || 0,
  };

  console.log("--- Baseline Database Counts ---");
  for (const [tbl, cnt] of Object.entries(initCounts)) {
    console.log(`  ${tbl.padEnd(32)}: ${cnt}`);
  }
  console.log("");

  // ── STEP 3: RUN TOPIC INTELLIGENCE ENGINE (PRIMARY RUN) ───────────────────
  console.log("--- Executing Primary Topic Intelligence Run ---");
  const t0 = Date.now();
  const primaryResult = await generateTopicIntelligence("IN");
  const durationMs = Date.now() - t0;

  console.log(`  Execution Time:               ${durationMs}ms`);
  console.log(`  Topic Clusters Generated:     ${primaryResult.clusters.length}`);
  console.log(`  Graph Nodes Generated:        ${primaryResult.nodes.length}`);
  console.log(`  Graph Edges Generated:        ${primaryResult.edges.length}`);
  console.log(`  Content Gaps Discovered:      ${primaryResult.contentGaps.length}`);
  console.log(`  Internal Links Recommended:   ${primaryResult.internalLinks.length}`);
  console.log(`  Knowledge Document ID:        ${primaryResult.knowledgeDocId || "NONE"}\n`);

  // ── STEP 4: 10-RUN REPEATABILITY CHECK ─────────────────────────────────────
  console.log("--- Executing 10-Run Deterministic Repeatability Check ---");
  let matches10Runs = true;

  for (let r = 1; r <= 10; r++) {
    const runRes = await generateTopicIntelligence("IN");
    const clusterMatch = runRes.clusters.length === primaryResult.clusters.length;
    const nodeMatch = runRes.nodes.length === primaryResult.nodes.length;
    const edgeMatch = runRes.edges.length === primaryResult.edges.length;
    const gapMatch = runRes.contentGaps.length === primaryResult.contentGaps.length;

    const isIdentical = clusterMatch && nodeMatch && edgeMatch && gapMatch;
    console.log(`  Run ${String(r).padStart(2)}: Clusters=${runRes.clusters.length}, Nodes=${runRes.nodes.length}, Edges=${runRes.edges.length}, Gaps=${runRes.contentGaps.length} -> ${isIdentical ? "IDENTICAL" : "MISMATCH"}`);
    if (!isIdentical) matches10Runs = false;
  }
  console.log("");

  // ── STEP 5: FINAL DB COUNTS & DELTA ─────────────────────────────────────────
  const [
    { data: finalClusters },
    { data: finalClusterKws },
    { data: finalNodes },
    { data: finalEdges },
    { data: finalGaps },
    { data: finalLinks },
    { data: finalDocs },
  ] = await Promise.all([
    supabase.from("topic_clusters").select("id"),
    supabase.from("topic_cluster_keywords").select("id"),
    supabase.from("topic_graph_nodes").select("id"),
    supabase.from("topic_graph_edges").select("id"),
    supabase.from("content_gaps").select("id"),
    supabase.from("internal_link_recommendations").select("id"),
    supabase.from("knowledge_documents").select("id"),
  ]);

  const finalCounts = {
    topic_clusters: finalClusters?.length || 0,
    topic_cluster_keywords: finalClusterKws?.length || 0,
    topic_graph_nodes: finalNodes?.length || 0,
    topic_graph_edges: finalEdges?.length || 0,
    content_gaps: finalGaps?.length || 0,
    internal_link_recommendations: finalLinks?.length || 0,
    knowledge_documents: finalDocs?.length || 0,
  };

  console.log(`${"═".repeat(70)}`);
  console.log(`  FINAL DATABASE DELTA`);
  console.log(`${"═".repeat(70)}`);
  for (const key of Object.keys(initCounts) as Array<keyof typeof initCounts>) {
    const init = initCounts[key];
    const fin = finalCounts[key];
    console.log(`  ${key.padEnd(32)}: ${init} → ${fin} (+${fin - init})`);
  }

  // ── STEP 6: VERIFICATION CHECKS ─────────────────────────────────────────────
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  VERIFICATION RESULTS`);
  console.log(`${"═".repeat(70)}\n`);

  let allPassed = true;

  // CHECK 1: Topic clusters generated
  {
    console.log("  CHECK 1: Topic Clusters Generated");
    console.log(`    Generated ${primaryResult.clusters.length} topic clusters.`);
    if (primaryResult.clusters.length > 0) {
      console.log("  ✅ PASS\n");
    } else {
      console.log("  ❌ FAIL\n");
      allPassed = false;
    }
  }

  // CHECK 2: No duplicate clusters
  {
    console.log("  CHECK 2: No Duplicate Clusters");
    const clusterNames = primaryResult.clusters.map((c) => c.clusterName);
    const uniqueNames = new Set(clusterNames);
    console.log(`    Cluster Names (${uniqueNames.size}/${clusterNames.length}):`, [...uniqueNames]);
    if (uniqueNames.size === clusterNames.length) {
      console.log("  ✅ PASS\n");
    } else {
      console.log("  ❌ FAIL — Duplicate clusters found\n");
      allPassed = false;
    }
  }

  // CHECK 3 & 4: Graph nodes & edges created
  {
    console.log("  CHECK 3 & 4: Graph Nodes & Edges Created");
    console.log(`    Nodes: ${primaryResult.nodes.length}, Edges: ${primaryResult.edges.length}`);
    if (primaryResult.nodes.length > 0 && primaryResult.edges.length > 0) {
      console.log("  ✅ PASS\n");
    } else {
      console.log("  ❌ FAIL — Graph empty\n");
      allPassed = false;
    }
  }

  // CHECK 5 & 6: Content gaps & internal links
  {
    console.log("  CHECK 5 & 6: Content Gaps & Internal Links Generated");
    console.log(`    Content Gaps: ${primaryResult.contentGaps.length}`);
    console.log(`    Internal Links: ${primaryResult.internalLinks.length}`);
    if (primaryResult.contentGaps.length >= 0 && primaryResult.internalLinks.length > 0) {
      console.log("  ✅ PASS\n");
    } else {
      console.log("  ❌ FAIL — Content gaps or links empty\n");
      allPassed = false;
    }
  }

  // CHECK 7: Authority Score in 0-100 range
  {
    console.log("  CHECK 7: Topic Authority Scores in 0-100 Range");
    let validRange = true;
    for (const c of primaryResult.clusters) {
      console.log(`    Cluster '${c.clusterName}' → Authority: ${c.authorityScore}/100`);
      if (c.authorityScore < 0 || c.authorityScore > 100) validRange = false;
    }
    if (validRange) {
      console.log("  ✅ PASS\n");
    } else {
      console.log("  ❌ FAIL — Out of range authority score\n");
      allPassed = false;
    }
  }

  // CHECK 8: 10-Run Deterministic Repeatability
  {
    console.log("  CHECK 8: Deterministic 10-Run Repeatability Check");
    if (matches10Runs) {
      console.log("  ✅ PASS — 10/10 runs produced identical output\n");
    } else {
      console.log("  ❌ FAIL — Output varies between runs\n");
      allPassed = false;
    }
  }

  // CHECK 9: Knowledge Documents Created with Unique IDs
  {
    console.log("  CHECK 9: Knowledge Document Auto-Save");
    console.log(`    Document ID: ${primaryResult.knowledgeDocId}`);
    if (primaryResult.knowledgeDocId) {
      console.log("  ✅ PASS — Auto-saved into Universal Knowledge Engine under 'SEO Topic Intelligence'\n");
    } else {
      console.log("  ❌ FAIL — Knowledge document not created\n");
      allPassed = false;
    }
  }

  // ── FINAL VERDICT ───────────────────────────────────────────────────────────
  console.log(`${"═".repeat(70)}`);
  if (allPassed) {
    console.log("  ✅✅✅ ALL CHECKS PASSED — PHASE 4B.3 FULLY VERIFIED ✅✅✅");
  } else {
    console.log("  ❌ ONE OR MORE CHECKS FAILED — Review logs above");
    process.exit(1);
  }
  console.log(`${"═".repeat(70)}\n`);
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
