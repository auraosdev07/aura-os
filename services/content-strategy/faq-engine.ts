/**
 * services/content-strategy/faq-engine.ts
 *
 * Deterministic FAQ List Generator Engine (Phase 4B.4).
 * Extracts PAA, Reddit, and Community questions and formats FAQ structure with answer placeholders.
 * NO LLM, 100% structure definition.
 */

import type { FAQItem } from "./types";

export function generateFAQList(
  collectedQuestions: Array<{ text: string; sourceName?: string }>,
  keyword: string
): FAQItem[] {
  const kwCap = keyword.replace(/\b\w/g, (l) => l.toUpperCase());
  const faqs: FAQItem[] = [];
  const seen = new Set<string>();

  for (const item of collectedQuestions) {
    const qText = item.text.trim();
    const lower = qText.toLowerCase();

    if (!seen.has(lower) && qText.length > 8) {
      seen.add(lower);
      const isHighPriority = lower.includes("original") || lower.includes("real") || lower.includes("wrist") || lower.includes("side effect");
      faqs.push({
        question: qText.endsWith("?") ? qText : `${qText}?`,
        priority: isHighPriority ? "HIGH" : "MEDIUM",
        answerPlaceholder: `[Answer Placeholder: Provide concise 2-3 sentence answer addressing '${qText}' with clear factual details.]`,
      });
    }

    if (faqs.length >= 8) break;
  }

  // Fallback defaults if collected questions are sparse
  if (faqs.length < 4) {
    const defaults = [
      `Which wrist should I wear a ${kwCap} on?`,
      `How do I know if my ${kwCap} is real or fake?`,
      `Can I wear a ${kwCap} while sleeping or bathing?`,
      `How do I cleanse and recharge my ${kwCap}?`,
    ];

    for (const d of defaults) {
      if (!seen.has(d.toLowerCase())) {
        faqs.push({
          question: d,
          priority: "HIGH",
          answerPlaceholder: `[Answer Placeholder: Provide concise 2-3 sentence answer addressing '${d}'.]`,
        });
      }
    }
  }

  return faqs;
}
