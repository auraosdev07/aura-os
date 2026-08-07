/**
 * services/content-strategy/title-engine.ts
 *
 * Deterministic Title Generator Engine (Phase 4B.4).
 * Generates 6+ structured, high-converting title options using templates.
 * NO LLM, 100% template-based formatting.
 */

import type { TitleRecommendation } from "./types";

export function generateTitleIdeas(keyword: string, country: string): TitleRecommendation[] {
  const kwCap = keyword.replace(/\b\w/g, (l) => l.toUpperCase());
  const year = new Date().getFullYear();
  const location = country === "IN" ? "in India" : "";

  return [
    {
      title: `Best ${kwCap} ${location} (${year}) — Ultimate Buying Guide`.replace(/\s+/g, " ").trim(),
      type: "Commercial Guide Title",
    },
    {
      title: `How ${kwCap} Works: Benefits, Meaning & Uses`.replace(/\s+/g, " ").trim(),
      type: "Informational Guide Title",
    },
    {
      title: `${kwCap} Benefits: Everything You Need to Know Before Buying`.replace(/\s+/g, " ").trim(),
      type: "Benefit Focused Title",
    },
    {
      title: `${kwCap} Buying Guide: How to Choose Original vs Fake`.replace(/\s+/g, " ").trim(),
      type: "Authenticity & Buying Guide Title",
    },
    {
      title: `Original ${kwCap} vs Fake: How to Spot Genuine Stones`.replace(/\s+/g, " ").trim(),
      type: "Comparison & Verification Title",
    },
    {
      title: `How to Choose a Genuine ${kwCap} ${location}`.replace(/\s+/g, " ").trim(),
      type: "Actionable How-To Title",
    },
  ];
}
