/**
 * services/qa-engine/orchestrator.ts
 *
 * Master Quality Assurance & Publish Readiness Engine Orchestrator.
 * Aggregates all 12 independent validator modules into an explainable scorecard.
 * Evaluates Publish Readiness Status: READY_TO_PUBLISH, NEEDS_REVIEW, REJECT.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type {
  QAInputPayload,
  QAAuditReport,
  ScorecardBreakdown,
  PublishReadinessStatus,
  ValidatorResult,
} from "./types";

import { validateGrammar } from "./validators/grammar";
import { validateHumanWriting } from "./validators/human-writing";
import { validateReadability } from "./validators/readability";
import { validateSEO } from "./validators/seo";
import { validateEEAT } from "./validators/eeat";
import { validateInternalLinks } from "./validators/internal-links";
import { validateSchema } from "./validators/schema";
import { validateMetadata } from "./validators/metadata";
import { validateCompleteness } from "./validators/completeness";
import { validateBrandVoice } from "./validators/brand-voice";
import { validateAIPatterns } from "./validators/ai-pattern-detector";
import { validateCTR } from "./validators/ctr";

export async function evaluateContentQuality(input: QAInputPayload): Promise<QAAuditReport> {
  const validatorResults: ValidatorResult[] = [];

  // Run 12 Independent Validators
  const grammarRes = validateGrammar(input);
  const humanWritingRes = validateHumanWriting(input);
  const readabilityRes = validateReadability(input);
  const seoRes = validateSEO(input);
  const eeatRes = validateEEAT(input);
  const internalLinksRes = validateInternalLinks(input);
  const schemaRes = validateSchema(input);
  const metadataRes = validateMetadata(input);
  const completenessRes = validateCompleteness(input);
  const brandVoiceRes = validateBrandVoice(input);
  const { result: aiPatternRes, probability: aiProbability } = validateAIPatterns(input);
  const ctrRes = validateCTR(input);

  validatorResults.push(
    grammarRes,
    humanWritingRes,
    readabilityRes,
    seoRes,
    eeatRes,
    internalLinksRes,
    schemaRes,
    metadataRes,
    completenessRes,
    brandVoiceRes,
    aiPatternRes,
    ctrRes
  );

  // Compute Scorecard Breakdown
  const scorecard: ScorecardBreakdown = {
    grammar: grammarRes.score,
    seo: seoRes.score,
    eeat: eeatRes.score,
    readability: readabilityRes.score,
    humanWriting: humanWritingRes.score,
    brandVoice: brandVoiceRes.score,
    schema: schemaRes.score,
    internalLinking: internalLinksRes.score,
    contentCompleteness: completenessRes.score,
    ctr: ctrRes.score,
    metadata: metadataRes.score,
    aiPatternDetection: aiPatternRes.score,
    overallPublishScore: 0,
  };

  // Calculate Weighted Overall Publish Score
  const totalScore =
    scorecard.grammar * 0.1 +
    scorecard.seo * 0.15 +
    scorecard.eeat * 0.15 +
    scorecard.readability * 0.1 +
    scorecard.humanWriting * 0.1 +
    scorecard.brandVoice * 0.1 +
    scorecard.schema * 0.05 +
    scorecard.internalLinking * 0.05 +
    scorecard.contentCompleteness * 0.1 +
    scorecard.ctr * 0.05;

  scorecard.overallPublishScore = Math.round(totalScore * 10) / 10;

  // Determine Publish Readiness Status
  let publishReadiness: PublishReadinessStatus = "READY_TO_PUBLISH";
  const criticalCount = validatorResults.filter((r) => r.severity === "CRITICAL").length;

  if (scorecard.overallPublishScore < 60 || criticalCount >= 3) {
    publishReadiness = "REJECT";
  } else if (scorecard.overallPublishScore < 85 || criticalCount >= 1 || aiProbability === "HIGH") {
    publishReadiness = "NEEDS_REVIEW";
  }

  // Aggregate Explainability (Reasons & Recommendations)
  const reasons: string[] = [];
  const recommendations: string[] = [];

  validatorResults.forEach((res) => {
    if (res.score < 85 || res.severity !== "INFO") {
      reasons.push(...res.findings.map((f) => `[${res.name} - ${res.score}/100]: ${f}`));
      recommendations.push(...res.recommendations.map((r) => `[${res.name}]: ${r}`));
    }
  });

  if (reasons.length === 0) {
    reasons.push("All 12 quality checks passed with optimal metrics");
  }

  const auditReport: QAAuditReport = {
    contentType: input.contentType,
    resourceId: input.resourceId,
    overallScore: scorecard.overallPublishScore,
    publishReadiness,
    aiPatternProbability: aiProbability,
    scorecard,
    validatorResults,
    reasons,
    recommendations,
    evaluatedBy: "Aura OS QA Engine v5.4",
    createdAt: new Date().toISOString(),
  };

  // Persist Audit Report to Supabase if database client available
  try {
    const { supabase } = await getServerContext();
    if (supabase && typeof supabase.from === "function") {
      const { data: inserted } = await supabase
        .from("qa_audit_reports")
        .insert({
          content_type: input.contentType,
          resource_id: input.resourceId,
          overall_score: scorecard.overallPublishScore,
          publish_readiness: publishReadiness,
          ai_pattern_probability: aiProbability,
          scorecard,
          validator_results: validatorResults,
          reasons,
          recommendations,
          evaluated_by: "Aura OS QA Engine v5.4",
        })
        .select()
        .single();

      if (inserted) {
        auditReport.id = inserted.id;
      }
    }
  } catch (err) {
    console.error("[QA ENGINE DB WARN]: Could not persist report to DB:", err);
  }

  return auditReport;
}
