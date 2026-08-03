/**
 * services/providers/provider-factory.ts
 *
 * Provider Factory
 * Returns the correct provider instance for a given provider name.
 * The Execution Engine calls this and receives a BaseProvider —
 * it never knows which concrete implementation is running.
 */

import { BaseProvider } from "./base-provider";
import { getRegisteredProvider } from "./provider-registry";

/**
 * Resolves a provider instance by name from the registry.
 * Defaults to OPENAI if the name is unrecognized.
 */
export function resolveProvider(providerName: string): BaseProvider {
  const provider = getRegisteredProvider(providerName);
  if (!provider) {
    const fallback = getRegisteredProvider("OPENAI");
    if (!fallback) {
      throw new Error(`No AI providers registered. Cannot resolve '${providerName}'.`);
    }
    console.warn(`[PROVIDER FACTORY] Unknown provider '${providerName}', falling back to OPENAI.`);
    return fallback;
  }
  return provider;
}
