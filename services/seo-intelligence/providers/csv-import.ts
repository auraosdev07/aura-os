/**
 * services/seo-intelligence/providers/csv-import.ts
 *
 * CSV Import Provider (Phase 4B.2 — CSV Ready Architecture).
 * Disabled by default. Allows future injection of CSV files from SEMrush, Ahrefs, GSC, etc.
 */

import type { SEOIntelligenceProvider, ProviderSignal } from "../types";

export class CSVImportProvider implements SEOIntelligenceProvider {
  id = "csv-import";
  name = "CSV File Import Provider";
  priority = 100;
  sourceType = "CSV_IMPORT" as const;
  trustScore = 1.0; // User CSV data has highest trust

  private importedSignals: ProviderSignal[] = [];

  /** Dynamic toggle — disabled by default */
  async isEnabled(): Promise<boolean> {
    return this.importedSignals.length > 0;
  }

  /** Load CSV records into provider memory */
  loadCsvSignals(signals: ProviderSignal[]): void {
    this.importedSignals = signals;
  }

  async collectSignals(): Promise<ProviderSignal[]> {
    return this.importedSignals;
  }
}
