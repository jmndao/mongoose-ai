/**
 * mongoose-ai: AI-enhanced Mongoose plugin
 */

import {
  checkEnvironment,
  createAdvancedAIConfig,
  createAIConfig,
  DEFAULT_CONFIG,
  estimateCost,
  estimateTokenCount,
  validateApiKey,
} from "./config-helpers";
import { aiPlugin } from "./plugin";
import { AnthropicProvider } from "./providers/anthropic";
import { OpenAIProvider } from "./providers/openai";
import { createFunction, QuickFunctions } from "./types";

// Core plugin
export { aiPlugin } from "./plugin";

// Providers
export { OpenAIProvider } from "./providers/openai";
export { AnthropicProvider } from "./providers/anthropic";

// All types
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
  AnthropicModelConfig,
  AIProcessingStats,
  AIError,
  AIDocument,
  AIModelType,
  AIDocumentMethods,
  AIModelStatics,
  WithAI,
  WithAIDocument,
  LogLevel,
  AIFunction,
  FunctionParameter,
  FunctionResult,
} from "./types";

// Function utilities from types
export { QuickFunctions, createFunction } from "./types";

// Type guards and utilities from types
export { hasAIMethods, hasAIDocumentMethods, isSearchResult } from "./types";

// Configuration helpers
export {
  createAIConfig,
  createAdvancedAIConfig,
  validateApiKey,
  estimateTokenCount,
  estimateCost,
  checkEnvironment,
  DEFAULT_CONFIG,
} from "./config-helpers";

/**
 * Package version
 */
export const VERSION = "1.3.0";

/**
 * Supported models and providers
 */
export const SUPPORTED_MODELS = ["summary", "embedding"] as const;
export const SUPPORTED_PROVIDERS = ["openai", "anthropic"] as const;

/**
 * Default export with core functionality (for backward compatibility)
 */
const mongooseAI = {
  // Core functions
  aiPlugin,
  OpenAIProvider,
  AnthropicProvider,

  // Function utilities
  QuickFunctions,
  createFunction,

  // Configuration helpers
  createAIConfig,
  createAdvancedAIConfig,
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
