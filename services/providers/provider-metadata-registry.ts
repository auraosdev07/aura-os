/**
 * services/providers/provider-metadata-registry.ts
 *
 * Single Source of Truth for Provider Metadata & Dynamic Discovery in Aura OS.
 * Adding a new provider requires ONLY:
 * 1. Adding its API key to .env.local
 * 2. Creating its provider implementation file (extending BaseProvider)
 * 3. Adding ONE entry below to PROVIDER_METADATA
 */

import type { ProviderMetadata, ProviderCapabilities } from "@/types/provider";

export const PROVIDER_METADATA: ProviderMetadata[] = [
  {
    providerId: "gemini",
    displayName: "Google Gemini",
    envVariableNames: ["GEMINI_API_KEY"],
    defaultModel: "gemini-2.0-flash",
    supportedModels: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", contextWindow: 1048576 },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", contextWindow: 2097152 },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", contextWindow: 1048576 },
    ],
    priority: 1,
    enabledByDefault: true,
    capabilities: {
      chat: true,
      vision: true,
      imageGeneration: false,
      videoGeneration: false,
      embeddings: true,
      reranking: false,
      speechToText: false,
      textToSpeech: false,
      functionCalling: true,
      streaming: true,
      jsonMode: true,
      reasoning: true,
    },
    pricing: {
      freeTier: true,
      estimatedInputCostPerMillion: 0.1,
      estimatedOutputCostPerMillion: 0.4,
    },
  },
  {
    providerId: "groq",
    displayName: "Groq LPU",
    envVariableNames: ["GROQ_API_KEY"],
    defaultModel: "llama-3.3-70b-versatile",
    supportedModels: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile", contextWindow: 128000 },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", contextWindow: 128000 },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", contextWindow: 32768 },
    ],
    priority: 2,
    enabledByDefault: true,
    capabilities: {
      chat: true,
      vision: false,
      imageGeneration: false,
      videoGeneration: false,
      embeddings: false,
      reranking: false,
      speechToText: true,
      textToSpeech: false,
      functionCalling: true,
      streaming: true,
      jsonMode: true,
      reasoning: true,
    },
    pricing: {
      freeTier: true,
      estimatedInputCostPerMillion: 0.59,
      estimatedOutputCostPerMillion: 0.79,
    },
  },
  {
    providerId: "openrouter",
    displayName: "OpenRouter AI",
    envVariableNames: ["OPENROUTER_API_KEY"],
    defaultModel: "google/gemini-2.0-flash-001",
    supportedModels: [
      { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash (OpenRouter)", contextWindow: 1048576 },
      { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B Instruct", contextWindow: 128000 },
      { id: "deepseek/deepseek-chat", label: "DeepSeek V3", contextWindow: 64000 },
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet (OpenRouter)", contextWindow: 200000 },
    ],
    priority: 3,
    enabledByDefault: true,
    capabilities: {
      chat: true,
      vision: true,
      imageGeneration: false,
      videoGeneration: false,
      embeddings: false,
      reranking: false,
      speechToText: false,
      textToSpeech: false,
      functionCalling: true,
      streaming: true,
      jsonMode: true,
      reasoning: true,
    },
    pricing: {
      freeTier: false,
      estimatedInputCostPerMillion: 0.15,
      estimatedOutputCostPerMillion: 0.6,
    },
  },
  {
    providerId: "github",
    displayName: "GitHub Models",
    envVariableNames: ["GITHUB_MODELS_API_KEY", "GITHUB_TOKEN"],
    defaultModel: "gpt-4o",
    supportedModels: [
      { id: "gpt-4o", label: "GPT-4o (GitHub)", contextWindow: 128000 },
      { id: "gpt-4o-mini", label: "GPT-4o Mini (GitHub)", contextWindow: 128000 },
      { id: "Phi-3.5-mini-instruct", label: "Phi-3.5 Mini", contextWindow: 128000 },
    ],
    priority: 4,
    enabledByDefault: true,
    capabilities: {
      chat: true,
      vision: true,
      imageGeneration: false,
      videoGeneration: false,
      embeddings: true,
      reranking: false,
      speechToText: false,
      textToSpeech: false,
      functionCalling: true,
      streaming: true,
      jsonMode: true,
      reasoning: true,
    },
    pricing: {
      freeTier: true,
      estimatedInputCostPerMillion: 0.0,
      estimatedOutputCostPerMillion: 0.0,
    },
  },
  {
    providerId: "openai",
    displayName: "OpenAI",
    envVariableNames: ["OPENAI_API_KEY"],
    defaultModel: "gpt-4o",
    supportedModels: [
      { id: "gpt-4o", label: "GPT-4o", contextWindow: 128000 },
      { id: "gpt-4o-mini", label: "GPT-4o Mini", contextWindow: 128000 },
      { id: "o3-mini", label: "o3-mini (Reasoning)", contextWindow: 200000 },
      { id: "dall-e-3", label: "DALL-E 3", contextWindow: 0 },
    ],
    priority: 5,
    enabledByDefault: true,
    capabilities: {
      chat: true,
      vision: true,
      imageGeneration: true,
      videoGeneration: false,
      embeddings: true,
      reranking: false,
      speechToText: true,
      textToSpeech: true,
      functionCalling: true,
      streaming: true,
      jsonMode: true,
      reasoning: true,
    },
    pricing: {
      freeTier: false,
      estimatedInputCostPerMillion: 2.5,
      estimatedOutputCostPerMillion: 10.0,
    },
  },
  {
    providerId: "claude",
    displayName: "Anthropic Claude",
    envVariableNames: ["ANTHROPIC_API_KEY"],
    defaultModel: "claude-3-5-sonnet-20241022",
    supportedModels: [
      { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", contextWindow: 200000 },
      { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", contextWindow: 200000 },
      { id: "claude-3-opus-20240229", label: "Claude 3 Opus", contextWindow: 200000 },
    ],
    priority: 6,
    enabledByDefault: true,
    capabilities: {
      chat: true,
      vision: true,
      imageGeneration: false,
      videoGeneration: false,
      embeddings: false,
      reranking: false,
      speechToText: false,
      textToSpeech: false,
      functionCalling: true,
      streaming: true,
      jsonMode: true,
      reasoning: true,
    },
    pricing: {
      freeTier: false,
      estimatedInputCostPerMillion: 3.0,
      estimatedOutputCostPerMillion: 15.0,
    },
  },
  {
    providerId: "nvidia",
    displayName: "NVIDIA NIM",
    envVariableNames: ["NVIDIA_API_KEY"],
    defaultModel: "meta/llama-3.3-70b-instruct",
    supportedModels: [
      { id: "meta/llama-3.3-70b-instruct", label: "Llama 3.3 70B (NVIDIA)", contextWindow: 128000 },
      { id: "nvidia/neva-22b", label: "Nvidia Neva Vision", contextWindow: 32768 },
    ],
    priority: 7,
    enabledByDefault: true,
    capabilities: {
      chat: true,
      vision: true,
      imageGeneration: false,
      videoGeneration: false,
      embeddings: true,
      reranking: true,
      speechToText: false,
      textToSpeech: false,
      functionCalling: true,
      streaming: true,
      jsonMode: true,
      reasoning: true,
    },
    pricing: {
      freeTier: true,
      estimatedInputCostPerMillion: 0.7,
      estimatedOutputCostPerMillion: 0.9,
    },
  },
];

/**
 * Returns all registered provider metadata entries sorted by priority.
 */
export function getAllProviderMetadata(): ProviderMetadata[] {
  return [...PROVIDER_METADATA].sort((a, b) => a.priority - b.priority);
}

/**
 * Retrieves metadata for a specific provider by ID (case-insensitive).
 */
export function getProviderMetadata(providerId: string): ProviderMetadata | undefined {
  const lower = providerId.toLowerCase();
  return PROVIDER_METADATA.find((p) => p.providerId.toLowerCase() === lower);
}

/**
 * Filters registered providers by a required capability.
 */
export function getProvidersByCapability(capability: keyof ProviderCapabilities): ProviderMetadata[] {
  return getAllProviderMetadata().filter((p) => p.capabilities[capability] === true);
}

/**
 * Checks if at least one environment variable for the provider is set in process.env.
 */
export function isProviderEnvConfigured(metadata: ProviderMetadata): boolean {
  return metadata.envVariableNames.some((envVar) => {
    const val = process.env[envVar];
    return val !== undefined && val.trim().length > 0;
  });
}
