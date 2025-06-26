/**
 * mongoose-ai: AI-enhanced Mongoose plugin
 */

import { aiPlugin } from "./plugin";
import { OpenAIProvider } from "./providers/openai";

// Re-export main functions
export { aiPlugin } from "./plugin";
export { OpenAIProvider } from "./providers/openai";

// Export all types
export type {
  AIModel,
  AIProvider,
  AICredentials,
  AIConfig,
  AIPluginOptions,
  SummaryResult,
  EmbeddingResult,
  SearchResult,
  SemanticSearchOptions,
  AIAdvancedOptions,
  OpenAIModelConfig,
  AIProcessingStats,
  AIError,
  AIDocument,
  AIModelType,
  AIDocumentMethods,
  AIModelStatics,
  WithAI,
  WithAIDocument,
  LogLevel,
} from "./types";

// Export utility functions
export { hasAIMethods, hasAIDocumentMethods, isSearchResult } from "./types";

// Import types for internal use
import type {
  AIConfig,
  AIModel,
  AIAdvancedOptions,
  OpenAIModelConfig,
} from "./types";

/**
 * Package version
 */
export const VERSION = "1.0.3";

/**
 * Supported models and providers
 */
export const SUPPORTED_MODELS = ["summary", "embedding"] as const;
export const SUPPORTED_PROVIDERS = ["openai"] as const;

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
  },
  modelConfig: {
    chatModel: "gpt-3.5-turbo",
    embeddingModel: "text-embedding-3-small",
    maxTokens: 200,
    temperature: 0.3,
  },
};

/**
 * Validate OpenAI API key format
 */
export function validateApiKey(apiKey: string): boolean {
  return (
    typeof apiKey === "string" && apiKey.startsWith("sk-") && apiKey.length > 20
  );
}

/**
 * Create AI configuration helper with advanced options
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
  if (!validateApiKey(options.apiKey)) {
    throw new Error("Invalid API key format");
  }

  return {
    model: options.model,
    provider: "openai",
    field: options.field,
    credentials: { apiKey: options.apiKey },
    prompt: options.prompt,
    advanced: { ...DEFAULT_CONFIG.advanced, ...options.advanced },
    modelConfig: { ...DEFAULT_CONFIG.modelConfig, ...options.modelConfig },
    includeFields: options.includeFields,
    excludeFields: options.excludeFields,
  };
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
 * Estimate cost for AI operations (based on OpenAI pricing)
 */
export function estimateCost(tokenCount: number, model: string): number {
  const pricing: Record<string, number> = {
    "gpt-3.5-turbo": 0.0015, // $0.0015 per 1K tokens
    "gpt-4": 0.03, // $0.03 per 1K tokens
    "gpt-4o": 0.005, // $0.005 per 1K tokens
    "gpt-4o-mini": 0.00015, // $0.00015 per 1K tokens
    "text-embedding-3-small": 0.00002, // $0.00002 per 1K tokens
    "text-embedding-3-large": 0.00013, // $0.00013 per 1K tokens
  };

  const pricePerToken = pricing[model] || 0.002;
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

  if (!env.OPENAI_API_KEY) {
    missing.push("OPENAI_API_KEY environment variable");
  } else if (!validateApiKey(env.OPENAI_API_KEY)) {
    warnings.push("OPENAI_API_KEY format appears invalid");
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Default export with all utilities
 */
const mongooseAI = {
  // Core functions
  aiPlugin,
  OpenAIProvider,

  // Utilities
  validateApiKey,
  createAIConfig,
  estimateTokenCount,
  estimateCost,
  checkEnvironment,

  // Constants
  VERSION,
  SUPPORTED_MODELS,
  SUPPORTED_PROVIDERS,
  DEFAULT_CONFIG,
};

export default mongooseAI;
