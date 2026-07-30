/**
 * lib/rag/chunker.ts
 *
 * Deterministic Recursive Character Text Splitter for RAG Knowledge Indexing.
 */

import type { ChunkItem, ChunkMetadata, ChunkOptions } from "./types";

export class RecursiveCharacterChunker {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(options?: ChunkOptions) {
    this.chunkSize = options?.chunkSize ?? 2000;
    this.chunkOverlap = options?.chunkOverlap ?? 250;
    this.separators = ["\n\n", "\n", ". ", "? ", "! ", "; ", " ", ""];
  }

  /**
   * Split input text into an array of ordered ChunkItems.
   */
  public chunkText(text: string, metadata: ChunkMetadata): ChunkItem[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const rawChunks = this.splitText(text, this.separators);
    const finalChunks: ChunkItem[] = [];

    let index = 0;
    for (const rawContent of rawChunks) {
      const content = rawContent.trim();
      if (!content) continue;

      // Estimate tokens: ~4 characters per token
      const tokenCount = Math.max(1, Math.ceil(content.length / 4));

      finalChunks.push({
        chunkIndex: index,
        content,
        tokenCount,
        metadata: {
          ...metadata,
          chunkIndex: index,
        },
      });

      index++;
    }

    return finalChunks;
  }

  private splitText(text: string, separators: string[]): string[] {
    const finalChunks: string[] = [];
    if (!text || text.trim().length === 0) return finalChunks;

    let separator = "";
    let nextSeparators: string[] = [];

    for (let i = 0; i < separators.length; i++) {
      const s = separators[i];
      if (s === "" || text.includes(s)) {
        separator = s;
        nextSeparators = separators.slice(i + 1);
        break;
      }
    }

    const splits = separator !== "" ? text.split(separator) : text.split("");

    let currentDoc: string[] = [];
    let totalLength = 0;

    for (const split of splits) {
      const part = currentDoc.length > 0 && separator !== "" ? separator + split : split;
      const partLength = part.length;

      if (partLength > this.chunkSize) {
        if (currentDoc.length > 0) {
          const docStr = currentDoc.join("");
          if (docStr.trim()) finalChunks.push(docStr.trim());
          currentDoc = [];
          totalLength = 0;
        }

        if (nextSeparators.length > 0) {
          const subChunks = this.splitText(split, nextSeparators);
          finalChunks.push(...subChunks);
        } else {
          // Hard character slice fallback
          for (let i = 0; i < split.length; i += this.chunkSize) {
            finalChunks.push(split.substring(i, i + this.chunkSize));
          }
        }
      } else if (totalLength + partLength > this.chunkSize) {
        const docStr = currentDoc.join("");
        if (docStr.trim()) finalChunks.push(docStr.trim());

        // Retain overlap from previous chunk tail
        let overlapStr = "";
        if (this.chunkOverlap > 0 && docStr.length > 0) {
          overlapStr = docStr.slice(-this.chunkOverlap);
        }

        currentDoc = overlapStr ? [overlapStr, part] : [part];
        totalLength = currentDoc.join("").length;
      } else {
        currentDoc.push(part);
        totalLength += partLength;
      }
    }

    if (currentDoc.length > 0) {
      const docStr = currentDoc.join("");
      if (docStr.trim()) finalChunks.push(docStr.trim());
    }

    return finalChunks;
  }
}

/** Convenience helper function for chunking. */
export function chunkText(
  text: string,
  metadata: ChunkMetadata,
  options?: ChunkOptions
): ChunkItem[] {
  const chunker = new RecursiveCharacterChunker(options);
  return chunker.chunkText(text, metadata);
}
