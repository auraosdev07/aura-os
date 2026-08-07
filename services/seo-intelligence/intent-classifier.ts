/**
 * services/seo-intelligence/intent-classifier.ts
 *
 * Deterministic Intent Classifier (Phase 4B.2).
 * Classifies search intent into INFORMATIONAL, COMMERCIAL, TRANSACTIONAL, or NAVIGATIONAL.
 * NO LLM reasoning. Dynamic confidence derived from all provider signals via ConfidenceEngine.
 */

import type { SEOIntent, ProviderSignal } from "./types";
import { calculateSignalConfidence } from "./confidence-engine";

export interface IntentClassificationResult {
  intent: SEOIntent;
  confidence: number;
}

const TRANSACTIONAL_PATTERNS = [
  /\bbuy\b/i, /\bshop\b/i, /\border\b/i, /\bprice\b/i, /\bcost\b/i,
  /\bcheap\b/i, /\bdeal\b/i, /\bsale\b/i, /\bdiscount\b/i, /\bcoupon\b/i,
  /\bonline store\b/i, /\bcheckout\b/i, /\bshipping\b/i,
];

const COMMERCIAL_PATTERNS = [
  /\bbest\b/i, /\btop\b/i, /\breview\b/i, /\breviews\b/i, /\bvs\b/i,
  /\bcompare\b/i, /\bcomparison\b/i, /\brating\b/i, /\brated\b/i,
  /\balternative\b/i, /\brecommended\b/i, /\bworth it\b/i,
];

const INFORMATIONAL_PATTERNS = [
  /\bhow\b/i, /\bwhat\b/i, /\bwhy\b/i, /\bwhen\b/i, /\bwhere\b/i,
  /\bguide\b/i, /\btutorial\b/i, /\bmeaning\b/i, /\bbenefits\b/i,
  /\bmeaning of\b/i, /\bhow to clean\b/i, /\bhow to wear\b/i, /\bideas\b/i,
];

export function classifyIntent(
  keyword: string,
  signals: ProviderSignal[]
): IntentClassificationResult {
  const combinedText = [keyword, ...signals.map((s) => s.text)].join(" ").toLowerCase();

  let transScore = 0;
  let commScore = 0;
  let infoScore = 0;

  for (const pattern of TRANSACTIONAL_PATTERNS) {
    if (pattern.test(combinedText)) transScore += 2;
  }
  for (const pattern of COMMERCIAL_PATTERNS) {
    if (pattern.test(combinedText)) commScore += 2;
  }
  for (const pattern of INFORMATIONAL_PATTERNS) {
    if (pattern.test(combinedText)) infoScore += 2;
  }

  let chosenIntent: SEOIntent = "INFORMATIONAL";

  if (transScore > commScore && transScore > infoScore) {
    chosenIntent = "TRANSACTIONAL";
  } else if (commScore > infoScore) {
    chosenIntent = "COMMERCIAL";
  } else {
    chosenIntent = "INFORMATIONAL";
  }

  const confidence = calculateSignalConfidence(keyword, signals, 1.0);

  return {
    intent: chosenIntent,
    confidence,
  };
}
