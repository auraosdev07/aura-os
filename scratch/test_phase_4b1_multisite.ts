/**
 * scratch/test_phase_4b1_multisite.ts
 *
 * Phase 4B.1 — Multi-Site SEO Audit Verification
 * Run from project root: npx tsx --env-file=.env.local scratch/test_phase_4b1_multisite.ts
 *
 * Verifies:
 *   CHECK 1: Different websites produce different health scores.
 *   CHECK 2: Duplicate Task Prevention works across multiple runs.
 *   CHECK 3: Rule Registry executes every registered rule exactly once.
 *   CHECK 4: Total generated issues = sum of all rule-level issue counts.
 *   CHECK 5: Knowledge document IDs are unique across all audits.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { auditCrawl } from "@/services/seo/seo-audit-engine";

const SITES = ["example.com", "nextjs.org", "vercel.com"];

async function main() {
  console.log("=== PHASE 4B.1 MULTI-SITE VERIFICATION ===\n");

  const { supabase } = await getServerContext();

  // ── Helpers ────────────────────────────────────────────────────────────────
  async function getCount(table: string): Promise<number> {
    const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
    return count ?? 0;
  }

  async function getLatestJobForHost(host: string) {
    const { data } = await supabase
      .from("crawl_jobs")
      .select("id, target_url")
      .ilike("target_url", `%${host}%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    return data as { id: string; target_url: string } | null;
  }

  async function getRecentDocs(since: Date, limit = 30) {
    const { data } = await supabase
      .from("knowledge_documents")
      .select("id, title, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as Array<{ id: string; title: string; created_at: string }>;
  }

  // ── Baseline ───────────────────────────────────────────────────────────────
  const baselineDocs  = await getCount("knowledge_documents");
  const baselineTasks = await getCount("tasks");
  const testStart     = new Date();

  console.log(`--- Baseline DB Counts ---`);
  console.log(`  knowledge_documents: ${baselineDocs}`);
  console.log(`  tasks:               ${baselineTasks}\n`);

  // ── PASS 1 — Audit all sites ───────────────────────────────────────────────
  type AuditResult = {
    site: string;
    jobId: string;
    targetUrl: string;
    healthScore: number;
    totalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    ruleStats: Array<{ ruleId: string; ruleName: string; issuesGenerated: number }>;
    knowledgeDocId: string | undefined;
    tasksCreated: number;
  };

  const results: AuditResult[] = [];

  for (const site of SITES) {
    console.log(`\n${"─".repeat(62)}`);
    console.log(`  Auditing: ${site}`);
    console.log(`${"─".repeat(62)}`);

    const job = await getLatestJobForHost(site);
    if (!job) {
      console.log(`  [SKIP] No completed crawl job found for ${site}.`);
      continue;
    }
    console.log(`  Job ID:  ${job.id}`);
    console.log(`  URL:     ${job.target_url}`);

    const beforeTasks = await getCount("tasks");
    const t0 = Date.now();
    const report = await auditCrawl(job.id);
    const elapsed = Date.now() - t0;
    const afterTasks = await getCount("tasks");

    const tasksCreated = afterTasks - beforeTasks;

    console.log(`\n  Audit in ${elapsed}ms`);
    console.log(`  Health Score:  ${report.healthScore}/100`);
    console.log(`  Issues:        ${report.totalIssues} (High: ${report.issueCounts.high}, Med: ${report.issueCounts.medium}, Low: ${report.issueCounts.low})`);
    console.log(`  Pages/Links/Images: ${report.analyzedPagesCount} / ${report.analyzedLinksCount} / ${report.analyzedImagesCount}`);
    console.log(`  Tasks Created: ${tasksCreated}`);
    console.log(`  Knowledge Doc: ${report.knowledgeDocumentId ?? "NOT SAVED"}`);
    console.log(`\n  Rule Distribution (${report.ruleStats.length} rules):`);
    for (const rs of report.ruleStats) {
      const bar = "█".repeat(Math.min(rs.issuesGenerated, 20));
      console.log(`    [${rs.ruleId.padEnd(32)}] ${String(rs.issuesGenerated).padStart(3)}  ${bar}`);
    }

    results.push({
      site,
      jobId: job.id,
      targetUrl: job.target_url,
      healthScore: report.healthScore,
      totalIssues: report.totalIssues,
      highIssues: report.issueCounts.high,
      mediumIssues: report.issueCounts.medium,
      lowIssues: report.issueCounts.low,
      ruleStats: report.ruleStats,
      knowledgeDocId: report.knowledgeDocumentId,
      tasksCreated,
    });
  }

  if (results.length === 0) {
    console.log("\n[FATAL] No audits ran. Ensure crawler has crawled all three sites first.");
    process.exit(1);
  }

  // ── Comparison Table ───────────────────────────────────────────────────────
  console.log(`\n\n${"═".repeat(72)}`);
  console.log(`  COMPARISON TABLE`);
  console.log(`${"═".repeat(72)}`);
  console.log(`  ${"Site".padEnd(15)} ${"Score".padStart(6)} ${"Total".padStart(6)} ${"High".padStart(5)} ${"Med".padStart(5)} ${"Low".padStart(5)} ${"Tasks+".padStart(7)}  Doc ID (prefix)`);
  console.log(`  ${"─".repeat(68)}`);
  for (const r of results) {
    const docSuffix = r.knowledgeDocId ? r.knowledgeDocId.slice(0, 8) + "..." : "NONE";
    console.log(`  ${r.site.padEnd(15)} ${String(r.healthScore).padStart(6)} ${String(r.totalIssues).padStart(6)} ${String(r.highIssues).padStart(5)} ${String(r.mediumIssues).padStart(5)} ${String(r.lowIssues).padStart(5)} ${String(r.tasksCreated).padStart(7)}  ${docSuffix}`);
  }

  // ── PASS 2 — Re-run all to test duplicate prevention ──────────────────────
  console.log(`\n${"═".repeat(72)}`);
  console.log(`  DUPLICATE TASK PREVENTION — 2ND PASS`);
  console.log(`${"═".repeat(72)}`);

  const tasksBefore2nd = await getCount("tasks");
  for (const r of results) {
    process.stdout.write(`  Re-auditing ${r.site}... `);
    await auditCrawl(r.jobId);
    process.stdout.write(`done\n`);
  }
  const tasksAfter2nd = await getCount("tasks");
  const newTasksIn2nd = tasksAfter2nd - tasksBefore2nd;

  console.log(`\n  Tasks before 2nd pass: ${tasksBefore2nd}`);
  console.log(`  Tasks after 2nd pass:  ${tasksAfter2nd}`);
  console.log(`  New tasks in 2nd pass: ${newTasksIn2nd}`);

  // ── Collect new knowledge docs ─────────────────────────────────────────────
  const newDocs = await getRecentDocs(testStart, 50);

  // ── VERIFICATION CHECKS ────────────────────────────────────────────────────
  console.log(`\n${"═".repeat(72)}`);
  console.log(`  VERIFICATION RESULTS`);
  console.log(`${"═".repeat(72)}\n`);

  let allPassed = true;

  // CHECK 1: Different health scores per site
  {
    console.log(`  CHECK 1 — Different websites produce different health scores`);
    const scores = results.map(r => r.healthScore);
    const uniqueScores = new Set(scores);
    for (const r of results) {
      console.log(`    ${r.site.padEnd(15)} → ${r.healthScore}/100`);
    }
    if (uniqueScores.size > 1) {
      console.log(`  ✅ PASS — ${uniqueScores.size} unique scores (${[...uniqueScores].join(", ")})\n`);
    } else {
      console.log(`  ❌ FAIL — All sites produced identical score: ${scores[0]}\n`);
      allPassed = false;
    }
  }

  // CHECK 2: Duplicate task prevention
  {
    console.log(`  CHECK 2 — Duplicate Task Prevention`);
    console.log(`    New tasks in 2nd pass: ${newTasksIn2nd}`);
    if (newTasksIn2nd === 0) {
      console.log(`  ✅ PASS — 0 duplicate tasks created\n`);
    } else {
      console.log(`  ❌ FAIL — ${newTasksIn2nd} duplicates created\n`);
      allPassed = false;
    }
  }

  // CHECK 3: Every rule runs exactly once per audit
  {
    console.log(`  CHECK 3 — Rule Registry executes every rule exactly once`);
    let check3Passed = true;
    for (const r of results) {
      const ruleIds = r.ruleStats.map(rs => rs.ruleId);
      const uniqueRuleIds = new Set(ruleIds);
      if (uniqueRuleIds.size !== ruleIds.length) {
        console.log(`    ❌ ${r.site}: ${ruleIds.length} runs, ${uniqueRuleIds.size} unique — DUPLICATE DETECTED`);
        check3Passed = false;
      } else {
        console.log(`    ✅ ${r.site}: ${ruleIds.length} rules, all unique`);
      }
    }
    console.log(check3Passed
      ? `  ✅ PASS — All rules executed exactly once per audit\n`
      : `  ❌ FAIL\n`);
    if (!check3Passed) allPassed = false;
  }

  // CHECK 4: total issues == sum of rule-level issue counts
  {
    console.log(`  CHECK 4 — Total issues equals sum of all rule outputs`);
    let check4Passed = true;
    for (const r of results) {
      const ruleSum = r.ruleStats.reduce((acc, rs) => acc + rs.issuesGenerated, 0);
      const match = ruleSum === r.totalIssues;
      console.log(`    ${r.site.padEnd(15)} → report.totalIssues: ${r.totalIssues}, Σ ruleStats: ${ruleSum} → ${match ? "✅ MATCH" : "❌ MISMATCH"}`);
      if (!match) check4Passed = false;
    }
    console.log(check4Passed
      ? `  ✅ PASS — All totals match rule sums\n`
      : `  ❌ FAIL — Mismatch detected\n`);
    if (!check4Passed) allPassed = false;
  }

  // CHECK 5: Knowledge doc IDs are unique
  {
    console.log(`  CHECK 5 — Knowledge document IDs are unique`);
    const docIds = results.map(r => r.knowledgeDocId).filter(Boolean) as string[];
    const uniqueDocIds = new Set(docIds);
    console.log(`    New knowledge documents created during test: ${newDocs.length}`);
    for (const doc of newDocs) {
      console.log(`      ${doc.id.slice(0, 8)}...  "${doc.title}"  @ ${doc.created_at}`);
    }
    const allUnique  = uniqueDocIds.size === docIds.length;
    const allCreated = docIds.length === results.length;
    if (allUnique && allCreated) {
      console.log(`  ✅ PASS — ${docIds.length} unique doc IDs (one per site)\n`);
    } else if (!allCreated) {
      console.log(`  ❌ FAIL — Only ${docIds.length}/${results.length} audits produced knowledge documents\n`);
      allPassed = false;
    } else {
      console.log(`  ❌ FAIL — Duplicate document IDs detected\n`);
      allPassed = false;
    }
  }

  // ── Final DB delta ─────────────────────────────────────────────────────────
  const finalDocs  = await getCount("knowledge_documents");
  const finalTasks = await getCount("tasks");

  console.log(`${"═".repeat(72)}`);
  console.log(`  FINAL DB DELTA`);
  console.log(`${"═".repeat(72)}`);
  console.log(`  knowledge_documents: ${baselineDocs} → ${finalDocs} (+${finalDocs - baselineDocs})`);
  console.log(`  tasks:               ${baselineTasks} → ${finalTasks} (+${finalTasks - baselineTasks})`);

  // ── Verdict ────────────────────────────────────────────────────────────────
  console.log(`\n${"═".repeat(72)}`);
  if (allPassed) {
    console.log(`  ✅✅✅ ALL 5 CHECKS PASSED — PHASE 4B.1 FULLY VERIFIED ✅✅✅`);
  } else {
    console.log(`  ❌ ONE OR MORE CHECKS FAILED — see output above`);
    process.exit(1);
  }
  console.log(`${"═".repeat(72)}\n`);
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
