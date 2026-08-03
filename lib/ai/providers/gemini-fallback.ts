/**
 * lib/ai/providers/gemini-fallback.ts
 *
 * Centralized Gemini Model Resolver & Dynamic Fallback System.
 * Ensures Aura OS automatically retries across model priority lists when Google retires or restricts models.
 */

export const DEFAULT_GEMINI_FALLBACK_MODELS = [
  "gemini-flash-latest",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];

let cachedWorkingModel: string | null = null;
const blacklistedModels = new Set<string>();

/**
 * Get candidate Gemini models ordered by priority.
 */
export function getGeminiCandidateModels(requestedModel?: string): string[] {
  const candidates: string[] = [];

  // 1. Requested model if provided and not blacklisted
  if (requestedModel && requestedModel.trim() && !blacklistedModels.has(requestedModel)) {
    candidates.push(requestedModel);
  }

  // 2. process.env.GEMINI_MODEL if configured and not blacklisted
  const envModel = process.env.GEMINI_MODEL?.trim();
  if (envModel && !blacklistedModels.has(envModel) && !candidates.includes(envModel)) {
    candidates.push(envModel);
  }

  // 3. Cached working model if set and not blacklisted
  if (cachedWorkingModel && !blacklistedModels.has(cachedWorkingModel) && !candidates.includes(cachedWorkingModel)) {
    candidates.push(cachedWorkingModel);
  }

  // 4. Default priority list
  for (const m of DEFAULT_GEMINI_FALLBACK_MODELS) {
    if (!blacklistedModels.has(m) && !candidates.includes(m)) {
      candidates.push(m);
    }
  }

  // If all candidates are blacklisted, reset blacklist to recover
  if (candidates.length === 0) {
    blacklistedModels.clear();
    return DEFAULT_GEMINI_FALLBACK_MODELS;
  }

  return candidates;
}

/**
 * Get current working model name for health check / configuration reporting.
 */
export function resolveGeminiModel(requestedModel?: string): string {
  if (cachedWorkingModel && !blacklistedModels.has(cachedWorkingModel)) {
    return cachedWorkingModel;
  }
  const candidates = getGeminiCandidateModels(requestedModel);
  return candidates[0] || DEFAULT_GEMINI_FALLBACK_MODELS[0];
}

/**
 * Mark a model as successful, updating the cached working model and logging if switched.
 */
export function markGeminiModelSuccess(model: string) {
  if (cachedWorkingModel !== model) {
    if (cachedWorkingModel) {
      console.log(`[GEMINI FALLBACK] Gemini model switched:\n${cachedWorkingModel}\n↓\n${model}`);
    }
    cachedWorkingModel = model;
  }
}

/**
 * Mark a model as failed, blacklisting it from immediate re-use.
 */
export function markGeminiModelFailed(model: string, errorReason?: string) {
  if (!blacklistedModels.has(model)) {
    console.warn(
      `[GEMINI FALLBACK WARNING] Model "${model}" failed (${errorReason || "error"}). Blacklisting and trying fallback.`
    );
    blacklistedModels.add(model);
    if (cachedWorkingModel === model) {
      cachedWorkingModel = null;
    }
  }
}

/**
 * Check whether an HTTP status or error string indicates a model availability/quota failure.
 */
export function isModelFallbackError(status: number, message: string): boolean {
  if (status === 404 || status === 429 || status === 503 || status === 500) {
    return true;
  }
  const lower = message.toLowerCase();
  return (
    lower.includes("not_found") ||
    lower.includes("not found") ||
    lower.includes("no longer available") ||
    lower.includes("unavailable to new users") ||
    lower.includes("high demand") ||
    lower.includes("resource_exhausted") ||
    lower.includes("quota")
  );
}

/**
 * Helper to execute a fetch request with automatic Gemini model fallback.
 */
export async function fetchWithGeminiFallback(options: {
  apiKey: string;
  endpointSuffix: string; // e.g. ":generateContent" or ":streamGenerateContent?alt=sse"
  fetchOptions: RequestInit;
  requestedModel?: string;
}): Promise<{ response: Response; usedModel: string }> {
  const candidates = getGeminiCandidateModels(options.requestedModel);
  let lastError: Error | null = null;

  for (const model of candidates) {
    const separator = options.endpointSuffix.includes("?") ? "&" : "?";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}${options.endpointSuffix}${separator}key=${options.apiKey}`;

    try {
      const res = await fetch(url, options.fetchOptions);

      if (res.ok) {
        markGeminiModelSuccess(model);
        return { response: res, usedModel: model };
      }

      const rawText = await res.text();
      let errMessage = `HTTP ${res.status}`;
      try {
        const errJson = JSON.parse(rawText);
        errMessage = errJson.error?.message || rawText || errMessage;
      } catch {
        errMessage = rawText || errMessage;
      }

      if (isModelFallbackError(res.status, errMessage)) {
        markGeminiModelFailed(model, errMessage);
        lastError = new Error(`Gemini Model "${model}" error (HTTP ${res.status}): ${errMessage}`);
        continue;
      } else {
        throw new Error(errMessage);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isModelFallbackError(500, msg)) {
        markGeminiModelFailed(model, msg);
        lastError = err instanceof Error ? err : new Error(msg);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("All candidate Gemini models failed.");
}
