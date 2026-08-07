/**
 * services/seo-intelligence/keyword-normalizer.ts
 *
 * Keyword Normalizer for Phase 4B.2.
 * Pure, deterministic text cleaning: URL decoding, NFKC normalization,
 * whitespace collapsing, punctuation cleanup, casing, and basic stemming.
 */

export interface NormalizedKeywordResult {
  original: string;
  normalized: string;
  tokens: string[];
}

export function normalizeKeyword(rawKeyword: string): NormalizedKeywordResult {
  if (!rawKeyword) {
    return { original: "", normalized: "", tokens: [] };
  }

  // 1. URL decode
  let cleaned = rawKeyword;
  try {
    cleaned = decodeURIComponent(rawKeyword);
  } catch {
    // Keep raw if URI malformed
  }

  // 2. Unicode NFKC Normalization
  cleaned = cleaned.normalize("NFKC");

  // 3. Lowercase
  cleaned = cleaned.toLowerCase();

  // 4. Replace punctuation with spaces (preserve hyphens within words)
  cleaned = cleaned.replace(/[^a-z0-9\s-]/g, " ");

  // 5. Collapse multiple spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // 6. Tokenize & Stemming (Basic deterministic singularization)
  const tokens = cleaned
    .split(" ")
    .filter(Boolean)
    .map((token) => {
      // Basic singular/plural normalization
      if (token.endsWith("ies") && token.length > 5) return token.slice(0, -3) + "y";
      if (token.endsWith("es") && token.length > 4 && !token.endsWith("ss")) return token.slice(0, -2);
      if (token.endsWith("s") && token.length > 3 && !token.endsWith("ss") && !token.endsWith("us")) return token.slice(0, -1);
      return token;
    });

  const normalized = tokens.join(" ");

  return {
    original: rawKeyword.trim(),
    normalized: normalized || cleaned,
    tokens,
  };
}
