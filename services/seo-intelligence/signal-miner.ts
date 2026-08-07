/**
 * services/seo-intelligence/signal-miner.ts
 *
 * Deterministic Signal Miner (Phase 4B.2).
 * Mines modifiers, brand/competitor mentions, pain points, benefits, objections,
 * use cases, target audience, content angles, and content formats from raw provider signals.
 * NO LLM. Pure token and pattern parsing.
 */

import type { SignalModifiers, MinedInsights, ProviderSignal } from "./types";

export function mineSignals(
  keyword: string,
  signals: ProviderSignal[]
): { modifiers: SignalModifiers; insights: MinedInsights } {
  const allTexts = [keyword, ...signals.map((s) => s.text)];

  // Initialize collections
  const modifiers: SignalModifiers = {
    searchModifiers: [],
    commercialModifiers: [],
    geoModifiers: [],
    questionModifiers: [],
    comparisonModifiers: [],
    priceModifiers: [],
    audienceModifiers: [],
    urgencyModifiers: [],
  };

  const insights: MinedInsights = {
    brandMentions: [],
    competitorMentions: [],
    painPoints: [],
    benefits: [],
    objections: [],
    useCases: [],
    targetAudience: [],
    contentAngles: [],
    contentFormats: [],
  };

  const addUnique = (arr: string[], val: string) => {
    const trimmed = val.trim();
    if (trimmed && !arr.includes(trimmed)) arr.push(trimmed);
  };

  for (const text of allTexts) {
    const lower = text.toLowerCase();

    // 1. Modifiers
    if (/\b(how|what|why|when|where|which|can i|is it)\b/i.test(lower)) addUnique(modifiers.questionModifiers, text);
    if (/\b(best|top|review|reviews|rating|recommended)\b/i.test(lower)) addUnique(modifiers.commercialModifiers, text);
    if (/\b(vs|or|compare|difference between|alternative)\b/i.test(lower)) addUnique(modifiers.comparisonModifiers, text);
    if (/\b(price|cost|cheap|wholesale|rate|under 500|under 1000)\b/i.test(lower)) addUnique(modifiers.priceModifiers, text);
    if (/\b(in india|near me|delhi|mumbai|bangalore|usa|uk)\b/i.test(lower)) addUnique(modifiers.geoModifiers, text);
    if (/\b(for women|for men|for couples|for beginners|for students)\b/i.test(lower)) addUnique(modifiers.audienceModifiers, text);
    if (/\b(fast|instant|today|urgent|quick)\b/i.test(lower)) addUnique(modifiers.urgencyModifiers, text);

    // 2. Mined Insights
    if (/\b(fake|broken|scam|side effect|side effects|heavy|allergic|color faded|color fade|damage)\b/i.test(lower)) {
      addUnique(insights.painPoints, text);
    }
    if (/\b(healing|love|attract|attracting love|peace|calm|wealth|money|energy|protection|chakra|reiki)\b/i.test(lower)) {
      addUnique(insights.benefits, text);
    }
    if (/\b(does it work|is it real|how to check real|waterproof|can i wear while sleeping|side effects)\b/i.test(lower)) {
      addUnique(insights.objections, text);
    }
    if (/\b(gifting|gift|meditation|daily wear|astrology|zodiac|fashion|office wear)\b/i.test(lower)) {
      addUnique(insights.useCases, text);
    }
    if (/\b(women|men|couples|girls|boys|beginners|unisex)\b/i.test(lower)) {
      addUnique(insights.targetAudience, text);
    }
    if (/\b(guide|pdf|video|unboxing|review|chart|list|tips)\b/i.test(lower)) {
      addUnique(insights.contentFormats, text);
    }
  }

  return { modifiers, insights };
}
