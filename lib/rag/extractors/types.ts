/**
 * lib/rag/extractors/types.ts
 *
 * TypeScript definitions for document extractors.
 */

export interface ExtractedDocument {
  text: string;
  metadata: {
    sourceId: string;
    sourceType: "knowledge_entry" | "artifact";
    title: string;
    mimeType?: string;
    filename?: string;
    ownerId: string;
    layer?: string;
    missionId?: string | null;
    employeeId?: string | null;
    [key: string]: unknown;
  };
}

export interface DocumentExtractor {
  /**
   * Determine if this extractor supports the given MIME type or file extension.
   */
  canExtract(mimeType: string, filename: string): boolean;

  /**
   * Extract plain text content and attach standard metadata.
   */
  extract(
    input: ArrayBuffer | string,
    metadata: Record<string, unknown>
  ): Promise<ExtractedDocument>;
}
