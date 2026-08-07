/**
 * services/topic-intelligence/relationship-engine.ts
 *
 * Deterministic Parent-Child Hierarchy Engine (Phase 4B.3).
 * Builds clean parent-child relationship chains based on token length & keyword specificity.
 * Example: Bracelets -> Rose Quartz Bracelet -> Rose Quartz Bracelet Benefits -> Rose Quartz Bracelet Price
 * NO LLM, 100% deterministic rules.
 */

export interface HierarchyNode {
  keyword: string;
  level: number;
  parent?: string;
  children: string[];
}

export function buildParentChildHierarchy(keywords: string[]): HierarchyNode[] {
  // Sort deterministically by word count ascending, then alphabetically
  const sorted = [...keywords].sort((a, b) => {
    const lenA = a.split(" ").length;
    const lenB = b.split(" ").length;
    if (lenA !== lenB) return lenA - lenB;
    return a.localeCompare(b);
  });

  const nodes: Map<string, HierarchyNode> = new Map();

  for (const kw of sorted) {
    nodes.set(kw, {
      keyword: kw,
      level: kw.split(" ").length,
      children: [],
    });
  }

  // Assign parents: a shorter keyword is a parent if target contains all parent tokens
  for (const childKw of sorted) {
    const childNode = nodes.get(childKw)!;
    let bestParent: string | undefined = undefined;
    let maxParentLevel = 0;

    for (const parentKw of sorted) {
      if (parentKw === childKw) continue;
      const parentTokens = parentKw.toLowerCase().split(" ");
      const childTokens = childKw.toLowerCase().split(" ");

      const isSubMatch = parentTokens.every((pt) => childTokens.includes(pt));
      if (isSubMatch && parentTokens.length < childTokens.length) {
        if (parentTokens.length > maxParentLevel) {
          maxParentLevel = parentTokens.length;
          bestParent = parentKw;
        }
      }
    }

    if (bestParent) {
      childNode.parent = bestParent;
      nodes.get(bestParent)?.children.push(childKw);
    }
  }

  return Array.from(nodes.values());
}
