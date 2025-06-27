/**
 * Configuration helpers and utilities
 */

import {
  AIConfig,
  AIModel,
  AIProvider,
  AIAdvancedOptions,
  OpenAIModelConfig,
  AnthropicModelConfig,
} from "./types";

/**
 * Default configurations
 */
export const DEFAULT_CONFIG = {
  advanced: {
    maxRetries: 2,
    timeout: 30000,
    skipOnUpdate: false,
    forceRegenerate: false,
    logLevel: "warn" as const,
    continueOnError: true,
    enableFunctions: false,
  },
  openai: {
    chatModel: "gpt-3.5-turbo",
    embeddingModel: "text-embedding-3-small",
    maxTokens: 200,
    temperature: 0.3,
  },
  anthropic: {
    chatModel: "claude-3-haiku-20240307",
    maxTokens: 200,
    temperature: 0.3,
  },
};

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string, provider: AIProvider): boolean {
  if (typeof apiKey !== "string" || apiKey.length < 20) {
    return false;
  }

  switch (provider) {
    case "openai":
      return apiKey.startsWith("sk-");
    case "anthropic":
      return apiKey.startsWith("sk-ant-") || apiKey.length > 20;
    default:
      return false;
  }
}

/**
 * Create AI configuration with all options
 */
export function createAdvancedAIConfig(options: {
  apiKey: string;
  provider: AIProvider;
  model: AIModel;
  field: string;
  prompt?: string;
  advanced?: Partial<AIAdvancedOptions>;
  modelConfig?: Partial<OpenAIModelConfig | AnthropicModelConfig>;
  includeFields?: string[];
  excludeFields?: string[];
  functions?: any[];
}): AIConfig {
  if (!validateApiKey(options.apiKey, options.provider)) {
    throw new Error(`Invalid API key format for ${options.provider}`);
  }

  const defaultModelConfig =
    options.provider === "openai"
      ? DEFAULT_CONFIG.openai
      : DEFAULT_CONFIG.anthropic;

  return {
    model: options.model,
    provider: options.provider,
    field: options.field,
    credentials: { apiKey: options.apiKey },
    prompt: options.prompt,
    advanced: { ...DEFAULT_CONFIG.advanced, ...options.advanced },
    modelConfig: { ...defaultModelConfig, ...options.modelConfig },
    includeFields: options.includeFields,
    excludeFields: options.excludeFields,
    functions: options.functions,
  };
}

/**
 * Create basic AI configuration (maintains v1.0.x compatibility)
 */
export function createAIConfig(options: {
  apiKey: string;
  model: AIModel;
  field: string;
  prompt?: string;
  advanced?: Partial<AIAdvancedOptions>;
  modelConfig?: Partial<OpenAIModelConfig>;
  includeFields?: string[];
  excludeFields?: string[];
}): AIConfig {
  return createAdvancedAIConfig({
    ...options,
    provider: "openai", // Default to OpenAI for backward compatibility
  });
}

/**
 * Estimate token count for text (rough estimation)
 */
export function estimateTokenCount(text: string): number {
  if (!text || typeof text !== "string") return 0;
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * Estimate cost for AI operations
 */
export function estimateCost(
  tokenCount: number,
  model: string,
  provider: AIProvider = "openai"
): number {
  const pricing: Record<string, Record<string, number>> = {
    openai: {
      "gpt-3.5-turbo": 0.0015,
      "gpt-4": 0.03,
      "gpt-4o": 0.005,
      "gpt-4o-mini": 0.00015,
      "text-embedding-3-small": 0.00002,
      "text-embedding-3-large": 0.00013,
    },
    anthropic: {
      "claude-3-haiku-20240307": 0.00025,
      "claude-3-sonnet-20240229": 0.003,
      "claude-3-opus-20240229": 0.015,
    },
  };

  const providerPricing = pricing[provider];
  const pricePerToken = providerPricing?.[model] || 0.002;
  return (tokenCount / 1000) * pricePerToken;
}

/**
 * Check if environment is properly configured
 */
export function checkEnvironment(): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check if we're in a browser environment
  const isNode =
    typeof globalThis !== "undefined" &&
    typeof globalThis.process !== "undefined" &&
    globalThis.process.versions?.node;

  if (!isNode) {
    warnings.push("Not running in Node.js environment");
    return { isValid: false, missing, warnings };
  }

  const env = globalThis.process.env;

  // Check for API keys
  if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
    missing.push("OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable");
  }

  if (env.OPENAI_API_KEY && !validateApiKey(env.OPENAI_API_KEY, "openai")) {
    warnings.push("OPENAI_API_KEY format appears invalid");
  }

  if (
    env.ANTHROPIC_API_KEY &&
    !validateApiKey(env.ANTHROPIC_API_KEY, "anthropic")
  ) {
    warnings.push("ANTHROPIC_API_KEY format appears invalid");
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}
