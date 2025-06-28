/**
 * mongoose-ai: AI-enhanced Mongoose plugin with local LLM support
 */

import {
  checkEnvironment,
  createAdvancedAIConfig,
  createAIConfig,
  createOllamaConfig,
  DEFAULT_CONFIG,
  estimateCost,
  estimateTokenCount,
  validateApiKey,
} from "./config-helpers";
import { aiPlugin } from "./plugin";
import { AnthropicProvider } from "./providers/anthropic";
import { OpenAIProvider } from "./providers/openai";
import { OllamaProvider } from "./providers/ollama";
import { createFunction, QuickFunctions } from "./types";

// Core plugin
export { aiPlugin } from "./plugin";

// Providers
export { OpenAIProvider } from "./providers/openai";
export { AnthropicProvider } from "./providers/anthropic";
export { OllamaProvider } from "./providers/ollama";

// All types (now modular)
export type {
  AIModel,
  AIProvider,
  LogLevel,
  AICredentials,
  AIAdvancedOptions,
  OpenAIModelConfig,
  AnthropicModelConfig,
  OllamaModelConfig,
  VectorSearchConfig,
  AIConfig,
  AIPluginOptions,
  FunctionParameter,
  AIFunction,
  FunctionResult,
  SummaryResult,
  EmbeddingResult,
  AIProcessingStats,
  AIError,
  SearchResult,
  SemanticSearchOptions,
  AIDocumentMethods,
  AIModelStatics,
  AIDocument,
  AIModelType,
  WithAI,
  WithAIDocument,
} from "./types";

// Function utilities
export { QuickFunctions, createFunction } from "./types";

// Type guards and utilities
export { hasAIMethods, hasAIDocumentMethods, isSearchResult } from "./types";

// Configuration helpers
export {
  createAIConfig,
  createAdvancedAIConfig,
  createOllamaConfig,
  validateApiKey,
  estimateTokenCount,
  estimateCost,
  checkEnvironment,
  DEFAULT_CONFIG,
} from "./config-helpers";

// Vector search utilities
export {
  detectVectorSearchSupport,
  createVectorIndex,
  cosineSimilarity,
} from "./utils/vector-search";

/**
 * Package version
 */
export const VERSION = "1.4.0";

/**
 * Supported models and providers
 */
export const SUPPORTED_MODELS = ["summary", "embedding"] as const;
export const SUPPORTED_PROVIDERS = ["openai", "anthropic", "ollama"] as const;

/**
 * Default export with core functionality (for backward compatibility)
 */
const mongooseAI = {
  // Core functions
  aiPlugin,
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,

  // Function utilities
  QuickFunctions,
  createFunction,

  // Configuration helpers
  createAIConfig,
  createAdvancedAIConfig,
  createOllamaConfig,
  validateApiKey,
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
