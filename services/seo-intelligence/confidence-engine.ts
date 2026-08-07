/**
 * services/seo-intelligence/confidence-engine.ts
 *
 * Dedicated Confidence Engine (Phase 4B.2).
 * Formula: Final Confidence = Provider Trust * Signal Frequency * Cross Source Presence * Rule Weight.
 * NO FIXED CONFIDENCE NUMBERS.
 */

import type { ProviderSignal } from "./types";

export function calculateSignalConfidence(
  signalText: string,
  allSignals: ProviderSignal[],
  ruleWeight: number = 1.0
): number {
  if (!signalText || allSignals.length === 0) return 0.5;

  const normalizedTarget = signalText.toLowerCase().trim();

  // 1. Calculate matching signals and unique provider sources
  const matchingSignals = allSignals.filter((s) => s.text.toLowerCase().includes(normalizedTarget));
  if (matchingSignals.length === 0) return 0.5;

  // 2. Provider Trust Average
  const totalTrust = matchingSignals.reduce((sum, s) => sum + (s.sourceTrust || 0.8), 0);
  const avgProviderTrust = totalTrust / matchingSignals.length;

  // 3. Signal Frequency Weight (Logarithmic scaling capped at 1.0)
  const frequencyRatio = Math.min(1.0, Math.log2(matchingSignals.length + 1) / 3.0);

  // 4. Cross Source Presence
  const uniqueProviders = new Set(matchingSignals.map((s) => s.sourceName)).size;
  const totalProviders = new Set(allSignals.map((s) => s.sourceName)).size;
  const crossSourcePresence = totalProviders > 0 ? uniqueProviders / totalProviders : 1.0;

  // Final Formula
  const finalConfidence = avgProviderTrust * (0.4 + 0.3 * frequencyRatio + 0.3 * crossSourcePresence) * ruleWeight;

  return Math.min(1.0, Math.max(0.1, Number(finalConfidence.toFixed(2))));
}
