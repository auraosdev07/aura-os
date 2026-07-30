/**
 * lib/rag/extractors/registry.ts
 *
 * Extractor Registry managing document extractors.
 */

import type { DocumentExtractor } from "./types";
import { PlainTextExtractor } from "./plain-text";

export class ExtractorRegistry {
  private static instance: ExtractorRegistry;
  private extractors: DocumentExtractor[] = [];

  private constructor() {
    // Register default built-in extractors
    this.registerExtractor(new PlainTextExtractor());
  }

  public static getInstance(): ExtractorRegistry {
    if (!ExtractorRegistry.instance) {
      ExtractorRegistry.instance = new ExtractorRegistry();
    }
    return ExtractorRegistry.instance;
  }

  public registerExtractor(extractor: DocumentExtractor): void {
    this.extractors.push(extractor);
  }

  public getExtractor(mimeType: string = "", filename: string = ""): DocumentExtractor {
    for (const extractor of this.extractors) {
      if (extractor.canExtract(mimeType, filename)) {
        return extractor;
      }
    }
    throw new Error(
      `No supported extractor found for file '${filename}' (MIME type: '${mimeType}'). Supported formats are .txt, .md, .json, .csv, .log.`
    );
  }

  public async extract(
    input: ArrayBuffer | string,
    metadata: Record<string, unknown>,
    mimeType: string = "",
    filename: string = ""
  ) {
    const extractor = this.getExtractor(mimeType, filename);
    return extractor.extract(input, metadata);
  }

  public isSupported(mimeType: string = "", filename: string = ""): boolean {
    return this.extractors.some((e) => e.canExtract(mimeType, filename));
  }
}

export const extractorRegistry = ExtractorRegistry.getInstance();
