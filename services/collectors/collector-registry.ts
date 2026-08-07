/**
 * services/collectors/collector-registry.ts
 *
 * Universal Data Collector Registry (Phase 4A Module 6).
 */

import type { DataCollector, CollectorSourceType } from "./types";
import { websiteCollector } from "./website-collector";

const registry = new Map<CollectorSourceType, DataCollector>();

function registerDefaults() {
  registry.set("WEBSITE", websiteCollector);
}

registerDefaults();

export function registerCollector(collector: DataCollector): void {
  registry.set(collector.sourceType, collector);
}

export function getCollector(sourceType: CollectorSourceType): DataCollector | undefined {
  return registry.get(sourceType);
}

export function listCollectors(): DataCollector[] {
  return Array.from(registry.values());
}
