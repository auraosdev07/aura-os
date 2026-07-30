/**
 * lib/rag/extractors/plain-text.ts
 *
 * Extractor for plain text formats (.txt, .md, .json, .csv, .log).
 */

import type { DocumentExtractor, ExtractedDocument } from "./types";

export class PlainTextExtractor implements DocumentExtractor {
  private static SUPPORTED_EXTENSIONS = new Set([
    "txt",
    "md",
    "json",
    "csv",
    "log",
  ]);

  private static SUPPORTED_MIME_TYPES = new Set([
    "text/plain",
    "text/markdown",
    "text/x-markdown",
    "application/json",
    "text/csv",
    "text/x-log",
    "text/log",
  ]);

  canExtract(mimeType: string, filename: string): boolean {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    if (PlainTextExtractor.SUPPORTED_EXTENSIONS.has(ext)) {
      return true;
    }
    const cleanMime = mimeType.split(";")[0].trim().toLowerCase();
    return PlainTextExtractor.SUPPORTED_MIME_TYPES.has(cleanMime);
  }

  async extract(
    input: ArrayBuffer | string,
    metadata: Record<string, unknown>
  ): Promise<ExtractedDocument> {
    let rawText = "";

    if (typeof input === "string") {
      rawText = input;
    } else if (input instanceof ArrayBuffer) {
      const decoder = new TextDecoder("utf-8");
      rawText = decoder.decode(input);
    } else {
      throw new Error("Unsupported input format for PlainTextExtractor.");
    }

    // Remove UTF-8 BOM if present while preserving exact original text formatting
    const formattedText = rawText.replace(/^\uFEFF/, "");

    return {
      text: formattedText,
      metadata: {
        sourceId: String(metadata.sourceId || ""),
        sourceType: (metadata.sourceType as "knowledge_entry" | "artifact") || "knowledge_entry",
        title: String(metadata.title || "Untitled Document"),
        mimeType: metadata.mimeType ? String(metadata.mimeType) : undefined,
        filename: metadata.filename ? String(metadata.filename) : undefined,
        ownerId: String(metadata.ownerId || ""),
        layer: metadata.layer ? String(metadata.layer) : undefined,
        missionId: metadata.missionId ? String(metadata.missionId) : null,
        employeeId: metadata.employeeId ? String(metadata.employeeId) : null,
        ...metadata,
      },
    };
  }
}
