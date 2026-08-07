/**
 * services/content-strategy/semantic-keyword-engine.ts
 *
 * Deterministic Semantic Keyword Engine (Phase 4B.4).
 * Groups collected suggestions, related searches, and graph keywords into:
 * Primary, Secondary, Supporting, Long Tail, Question Keywords, Commercial Keywords.
 * NO LLM, 100% rule-based categorization.
 */

import type { SemanticKeywordGroup } from "./types";

export function groupSemanticKeywords(
  keyword: string,
  suggestions: Array<{ text: string }>,
  relatedSearches: Array<{ text: string }>,
  questions: Array<{ text: string }>
): SemanticKeywordGroup {
  const allTexts = Array.from(
    new Set([
      keyword,
      ...suggestions.map((s) => s.text),
      ...relatedSearches.map((r) => r.text),
      ...questions.map((q) => q.text),
    ])
  );

  const primary: string[] = [keyword];
  const secondary: string[] = [];
  const supporting: string[] = [];
  const longTail: string[] = [];
  const questionKeywords: string[] = [];
  const commercialKeywords: string[] = [];

  for (const text of allTexts) {
    if (text.toLowerCase() === keyword.toLowerCase()) continue;

    const lower = text.toLowerCase();
    const wordCount = text.split(" ").length;

    if (lower.startsWith("how") || lower.startsWith("what") || lower.startsWith("why") || lower.includes("?")) {
      questionKeywords.push(text);
    }

    if (lower.includes("best") || lower.includes("price") || lower.includes("buy") || lower.includes("cheap") || lower.includes("original")) {
      commercialKeywords.push(text);
    }

    if (wordCount >= 4) {
      longTail.push(text);
    } else if (wordCount === 3) {
      secondary.push(text);
    } else {
      supporting.push(text);
    }
  }

  return {
    primary,
    secondary: Array.from(new Set(secondary)).slice(0, 10),
    supporting: Array.from(new Set(supporting)).slice(0, 10),
    longTail: Array.from(new Set(longTail)).slice(0, 10),
    questionKeywords: Array.from(new Set(questionKeywords)).slice(0, 10),
    commercialKeywords: Array.from(new Set(commercialKeywords)).slice(0, 10),
  };
}
