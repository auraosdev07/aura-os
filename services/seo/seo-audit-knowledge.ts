/**
 * services/seo/seo-audit-knowledge.ts
 *
 * SEO Audit Knowledge Integration Module (Phase 4B.1).
 * Auto-saves SEO audit report into the Universal Knowledge Engine under "SEO Audits" collection.
 */

import { getCollections, createCollection, createDocument } from "@/services/knowledge-engine";
import type { SEOAuditReport } from "./types";

export async function saveSEOAuditToKnowledge(report: SEOAuditReport): Promise<string | undefined> {
  try {
    const collections = await getCollections();
    let auditColl = collections.find((c) => c.name === "SEO Audits");

    if (!auditColl) {
      auditColl = await createCollection({
        name: "SEO Audits",
        description: "Technical SEO audit reports, site health scores, issue breakdowns, and rule statistics.",
        type: "DOCUMENTATION",
        tags: ["seo", "audit", "technical_seo"],
      });
    }

    const highIssues = report.issues.filter((i) => i.severity === "HIGH");

    const issuesText = report.issues.length > 0
      ? "\n\nTop Audit Issues:\n" +
        report.issues.slice(0, 15).map((i) => `- [${i.severity}] ${i.issue} on ${i.affectedUrl}: ${i.recommendation}`).join("\n")
      : "\n\nNo technical SEO issues detected.";

    const fullContent = `SEO Audit Report for ${report.targetUrl}
Job ID: ${report.jobId}
Site Health Score: ${report.healthScore}/100
Total Issues: ${report.totalIssues} (High: ${report.issueCounts.high}, Medium: ${report.issueCounts.medium}, Low: ${report.issueCounts.low})
Pages Analyzed: ${report.analyzedPagesCount}
Links Analyzed: ${report.analyzedLinksCount}
Images Analyzed: ${report.analyzedImagesCount}${issuesText}`;

    const doc = await createDocument({
      collectionId: auditColl.id,
      title: `SEO Audit: ${report.targetUrl} (Score: ${report.healthScore}/100)`,
      source: report.targetUrl,
      rawContent: fullContent,
      summary: `SEO Audit for ${report.targetUrl} achieved Health Score ${report.healthScore}/100 with ${highIssues.length} high-severity issues.`,
      tags: ["seo_audit", `job_${report.jobId}`, `score_${report.healthScore}`],
      language: "en",
    });
    return doc?.id as string | undefined;
  } catch (err) {
    console.error("[SAVE SEO AUDIT KNOWLEDGE ERROR]:", err);
    return undefined;
  }
}
