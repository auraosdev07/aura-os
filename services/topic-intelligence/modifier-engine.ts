/**
 * services/topic-intelligence/modifier-engine.ts
 *
 * Deterministic Modifier Classification Engine (Phase 4B.3).
 * Categorizes keyword modifiers into Search, Commercial, Geo, Audience, Question, Urgency, Comparison.
 * NO LLM, NO Randomness. 100% deterministic regex and pattern dictionary.
 */

export type ModifierCategory =
  | "Search"
  | "Commercial"
  | "Geo"
  | "Audience"
  | "Question"
  | "Urgency"
  | "Comparison";

export interface ClassifiedModifier {
  text: string;
  category: ModifierCategory;
}

const MODIFIER_DICTIONARY: Record<ModifierCategory, RegExp[]> = {
  Commercial: [
    /\b(best|top|cheap|price|cost|rate|discount|wholesale|deal|under \d+|review|reviews|rating|rated|worth it|original|genuine|real)\b/i,
  ],
  Search: [
    /\b(online|buy|shop|order|store|near me|website|app|pdf|download|chart)\b/i,
  ],
  Geo: [
    /\b(in india|delhi|mumbai|bangalore|usa|uk|online|near me|chennai|hyderabad)\b/i,
  ],
  Audience: [
    /\b(for women|for men|for couples|for beginners|for students|unisex|girls|boys)\b/i,
  ],
  Question: [
    /\b(how|what|why|when|where|which|can i|is it|how to|does it|meaning|benefits)\b/i,
  ],
  Urgency: [
    /\b(fast|instant|today|urgent|quick|express)\b/i,
  ],
  Comparison: [
    /\b(vs|or|compare|comparison|difference between|alternative|alternatives)\b/i,
  ],
};

export function classifyModifier(modifierText: string): ClassifiedModifier {
  const lower = modifierText.toLowerCase().trim();

  for (const [category, patterns] of Object.entries(MODIFIER_DICTIONARY)) {
    for (const pattern of patterns) {
      if (pattern.test(lower)) {
        return { text: lower, category: category as ModifierCategory };
      }
    }
  }

  return { text: lower, category: "Search" };
}
