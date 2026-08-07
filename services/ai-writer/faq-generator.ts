/**
 * services/ai-writer/faq-generator.ts
 *
 * FAQ Generator for Phase 4B.5A AI Writer Engine.
 * Consumes FAQ Placeholders, PAA, and Community Questions to produce final Q&A pairs.
 * NO LLM required — generates clear factual crystal answers.
 */

import type { SEOContentBrief } from "@/services/content-strategy/types";

export interface FinalFAQPair {
  question: string;
  answer: string;
}

export function generateFinalFAQs(brief: SEOContentBrief): FinalFAQPair[] {
  const kwCap = brief.keyword.replace(/\b\w/g, (c) => c.toUpperCase());
  const faqs: FinalFAQPair[] = [];

  for (const item of brief.faqList) {
    const q = item.question;
    const lower = q.toLowerCase();

    let answer = `Wearing a genuine ${kwCap} provides spiritual balance and daily aesthetic elegance. Ensure your gemstone is certified natural for optimal energetic resonance.`;

    if (lower.includes("wrist")) {
      answer = `Traditionally, wearing a ${kwCap} on your left (receptive) wrist helps internalize its healing and emotional energy, while wearing it on your right (projective) wrist releases energy outward.`;
    } else if (lower.includes("real") || lower.includes("fake") || lower.includes("check")) {
      answer = `To verify if a ${kwCap} is authentic, check for natural coldness to touch, subtle weight, and minor internal inclusions. Synthetic glass remains warm and lacks natural mineral variations.`;
    } else if (lower.includes("cleanse") || lower.includes("recharge")) {
      answer = `Cleanse your ${kwCap} by rinsing it under lukewarm running water for 30 seconds or immersing it in sage smoke. Recharge it under overnight moonlight.`;
    } else if (lower.includes("sleeping") || lower.includes("bath")) {
      answer = `It is safe to wear your ${kwCap} during sleep for peaceful dreaming, but it is recommended to remove it before bathing or swimming to preserve elastic cord durability.`;
    }

    faqs.push({ question: q, answer });
  }

  return faqs;
}
