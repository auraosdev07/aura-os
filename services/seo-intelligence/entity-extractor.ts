/**
 * services/seo-intelligence/entity-extractor.ts
 *
 * Deterministic Entity Extraction Engine (Phase 4B.2).
 * Extracts brand, product, material, location, attribute, and synonym entities.
 * NO HARDCODED CONFIDENCE VALUES — calculated dynamically via ConfidenceEngine.
 */

import type { ExtractedEntity, EntityType, ProviderSignal } from "./types";
import { calculateSignalConfidence } from "./confidence-engine";

const KNOWN_MATERIALS = [
  "rose quartz", "amethyst", "money magnet", "7 chakra", "clear quartz",
  "citrine", "black tourmaline", "pyrite", "tiger eye", "carnelian",
  "green jade", "obsidian", "lapis lazuli", "moonstone", "gold", "silver",
  "crystal", "gemstone", "rudraksha",
];

const KNOWN_PRODUCTS = [
  "bracelet", "necklaces", "necklace", "ring", "rings", "pendant", "pendants",
  "mala", "beads", "stone", "jewellery", "jewelry", "tree", "pyramid", "crystal tree",
];

const KNOWN_BRANDS = [
  "pandora", "swarovski", "tanishq", "giva", "caratlane", "zariin", "amazon", "flipkart", "etsy",
];

const KNOWN_LOCATIONS = [
  "india", "delhi", "mumbai", "bangalore", "usa", "uk", "online", "near me",
];

const KNOWN_ATTRIBUTES = [
  "original", "certified", "natural", "raw", "real", "genuine", "8mm", "10mm",
  "stretchable", "elastic", "polished", "charged", "reiki", "healing", "unisex",
];

export function extractEntities(
  keyword: string,
  signals: ProviderSignal[]
): ExtractedEntity[] {
  const corpus = [keyword, ...signals.map((s) => s.text)].join(" ").toLowerCase();
  const foundEntities: Map<string, { text: string; type: EntityType; sources: Set<string> }> = new Map();

  const scanDictionary = (list: string[], type: EntityType) => {
    for (const term of list) {
      if (corpus.includes(term)) {
        const matchingSources = signals
          .filter((s) => s.text.toLowerCase().includes(term))
          .map((s) => s.sourceName);

        const existing = foundEntities.get(term);
        if (existing) {
          matchingSources.forEach((src) => existing.sources.add(src));
        } else {
          foundEntities.set(term, {
            text: term,
            type,
            sources: new Set(matchingSources.length > 0 ? matchingSources : ["Keyword Input"]),
          });
        }
      }
    }
  };

  scanDictionary(KNOWN_MATERIALS, "material");
  scanDictionary(KNOWN_PRODUCTS, "product");
  scanDictionary(KNOWN_BRANDS, "brand");
  scanDictionary(KNOWN_LOCATIONS, "location");
  scanDictionary(KNOWN_ATTRIBUTES, "attribute");

  const results: ExtractedEntity[] = [];

  for (const entity of foundEntities.values()) {
    const sourcesArr = Array.from(entity.sources);
    const confidence = calculateSignalConfidence(entity.text, signals, 1.0);

    results.push({
      text: entity.text,
      type: entity.type,
      confidence,
      sources: sourcesArr,
    });
  }

  return results;
}
