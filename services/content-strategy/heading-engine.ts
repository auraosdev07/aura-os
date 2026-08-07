/**
 * services/content-strategy/heading-engine.ts
 *
 * Deterministic Heading Tree Generator Engine (Phase 4B.4).
 * Produces structured H1, H2, H3, H4 hierarchy using Intent, Questions, Modifiers, and Entities.
 * NO LLM, 100% deterministic heading structure.
 */

import type { HeadingNode } from "./types";

export function generateHeadingTree(
  keyword: string,
  questions: string[],
  entities: Array<{ text: string; type: string }>
): HeadingNode[] {
  const kwCap = keyword.replace(/\b\w/g, (l) => l.toUpperCase());

  const h1Text = `The Complete ${kwCap} Guide: Meaning, Benefits & Buying Guide`;

  const materials = entities.filter((e) => e.type === "material").map((e) => e.text);
  const materialSubheadings: HeadingNode[] = materials.slice(0, 3).map((m) => ({
    level: "H3",
    text: `Understanding ${m.replace(/\b\w/g, (l) => l.toUpperCase())} Properties`,
  }));

  const questionSubheadings: HeadingNode[] = questions.slice(0, 4).map((q) => ({
    level: "H3",
    text: q.endsWith("?") ? q : `${q}?`,
  }));

  const headingTree: HeadingNode[] = [
    {
      level: "H1",
      text: h1Text,
      subheadings: [
        {
          level: "H2",
          text: `What is a ${kwCap}?`,
          subheadings: [
            { level: "H3", text: `Origins & Spiritual Meaning of ${kwCap}` },
            ...materialSubheadings,
          ],
        },
        {
          level: "H2",
          text: `Key Benefits & Healing Properties of ${kwCap}`,
          subheadings: [
            { level: "H3", text: `Emotional & Spiritual Benefits` },
            { level: "H3", text: `Physical & Daily Wear Benefits` },
          ],
        },
        {
          level: "H2",
          text: `How to Identify an Original vs Fake ${kwCap}`,
          subheadings: [
            { level: "H3", text: `Visual & Weight Inspection Checklist` },
            { level: "H3", text: `Lab Certification & Authenticity Test` },
          ],
        },
        {
          level: "H2",
          text: `Frequently Asked Questions About ${kwCap}`,
          subheadings: questionSubheadings.length > 0 ? questionSubheadings : [
            { level: "H3", text: `Which wrist should you wear ${kwCap} on?` },
            { level: "H3", text: `How do you cleanse and recharge ${kwCap}?` },
          ],
        },
        {
          level: "H2",
          text: `Conclusion & Where to Buy Authentic ${kwCap}`,
        },
      ],
    },
  ];

  return headingTree;
}
