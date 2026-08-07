/**
 * services/growth/provider-adapters/base-adapter.ts
 *
 * Base Trend Adapter class implementing Provider -> Adapter -> Normalizer pattern.
 */

import type { TrendAdapterInterface, NormalizedTrendDTO } from "../types";

export abstract class BaseTrendAdapter implements TrendAdapterInterface {
  abstract providerId: string;
  abstract providerName: string;
  abstract category: string;

  abstract fetchRawTrends(queryCategory?: string): Promise<Record<string, unknown>[]>;

  abstract normalize(rawItems: Record<string, unknown>[]): NormalizedTrendDTO[];

  async fetchTrends(queryCategory?: string): Promise<NormalizedTrendDTO[]> {
    const raw = await this.fetchRawTrends(queryCategory);
    return this.normalize(raw);
  }
}
