/**
 * services/crawler/link-graph.ts
 *
 * Link Graph Builder Module (Phase 4A Step 4).
 * Constructs link graph structure mapping parent/child pages, depth levels,
 * incoming/outgoing link counts, and anchor texts across the crawled domain.
 */

import type { LinkGraphNode, ParsedHTMLPage } from "./types";

export class LinkGraphBuilder {
  private nodes = new Map<string, LinkGraphNode>();

  /** Adds a parsed page into the graph */
  public addPage(page: ParsedHTMLPage, pageId: string, parentUrl?: string | null): void {
    const existing = this.nodes.get(page.url);

    const children = page.links.filter((l) => l.isInternal).map((l) => l.canonicalUrl);
    const anchorTexts = page.links.map((l) => l.anchorText).filter(Boolean);

    if (existing) {
      existing.pageId = pageId;
      existing.childrenUrls = Array.from(new Set([...existing.childrenUrls, ...children]));
      existing.outgoingLinksCount = page.links.length;
      existing.anchorTexts = Array.from(new Set([...existing.anchorTexts, ...anchorTexts]));
    } else {
      this.nodes.set(page.url, {
        pageId,
        url: page.url,
        depth: page.depth,
        parentUrl: parentUrl || null,
        childrenUrls: Array.from(new Set(children)),
        incomingLinksCount: 0,
        outgoingLinksCount: page.links.length,
        anchorTexts: Array.from(new Set(anchorTexts)),
      });
    }

    // Update incoming link counts for target children
    for (const link of page.links) {
      if (link.isInternal) {
        const targetNode = this.nodes.get(link.canonicalUrl);
        if (targetNode) {
          targetNode.incomingLinksCount++;
          if (link.anchorText) {
            targetNode.anchorTexts = Array.from(new Set([...targetNode.anchorTexts, link.anchorText]));
          }
        } else {
          this.nodes.set(link.canonicalUrl, {
            pageId: "",
            url: link.canonicalUrl,
            depth: page.depth + 1,
            parentUrl: page.url,
            childrenUrls: [],
            incomingLinksCount: 1,
            outgoingLinksCount: 0,
            anchorTexts: link.anchorText ? [link.anchorText] : [],
          });
        }
      }
    }
  }

  /** Returns all compiled graph nodes */
  public getGraph(): Record<string, LinkGraphNode> {
    return Object.fromEntries(this.nodes.entries());
  }
}
