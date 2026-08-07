/**
 * services/topic-intelligence/internal-link-engine.ts
 *
 * Deterministic Internal Link Recommendation Engine (Phase 4B.3).
 * Rules:
 *   - Parent -> Child
 *   - Higher Authority -> Lower Authority
 *   - Sibling -> Sibling
 *   - Question -> Answer / Product
 *   - Benefits -> Product
 *   - Meaning -> Guide
 * Score: 0-100. NO LLM, 100% deterministic rules.
 */

import type { InternalLinkRecommendation } from "./types";
import type { HierarchyNode } from "./relationship-engine";

export function generateInternalLinks(
  hierarchyNodes: HierarchyNode[],
  clusterName: string
): InternalLinkRecommendation[] {
  const recommendations: InternalLinkRecommendation[] = [];

  for (const node of hierarchyNodes) {
    const src = node.keyword;

    // 1. Parent -> Child Recommendations
    for (const child of node.children) {
      recommendations.push({
        sourceKeyword: src,
        targetKeyword: child,
        reason: `Topical Hierarchy: Link pillar '${src}' to specific sub-topic '${child}'`,
        score: 95,
      });
    }

    // 2. Intent & Modifier Based Routing
    const lowerSrc = src.toLowerCase();

    if (lowerSrc.includes("benefits") || lowerSrc.includes("meaning")) {
      // Find matching product node in same hierarchy
      const productNode = hierarchyNodes.find(
        (n) => n.level < node.level && lowerSrc.includes(n.keyword.toLowerCase())
      );
      if (productNode && productNode.keyword !== src) {
        recommendations.push({
          sourceKeyword: src,
          targetKeyword: productNode.keyword,
          reason: `Conversion Routing: Pass informational authority from '${src}' to transactional target '${productNode.keyword}'`,
          score: 90,
        });
      }
    }

    // 3. Sibling -> Sibling Recommendations
    if (node.parent) {
      const parentNode = hierarchyNodes.find((n) => n.keyword === node.parent);
      if (parentNode) {
        const siblings = parentNode.children.filter((c) => c !== src);
        for (const sib of siblings.slice(0, 2)) { // max 2 siblings
          recommendations.push({
            sourceKeyword: src,
            targetKeyword: sib,
            reason: `Cross-Selling & Contextual Relevance: Connect related sub-topics under '${node.parent}'`,
            score: 75,
          });
        }
      }
    }
  }

  // Deduplicate recommendations by (source_keyword, target_keyword)
  const uniqueRecs: InternalLinkRecommendation[] = [];
  const seen = new Set<string>();

  for (const rec of recommendations) {
    const key = `${rec.sourceKeyword}->${rec.targetKeyword}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRecs.push(rec);
    }
  }

  return uniqueRecs;
}
