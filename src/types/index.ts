/**
 * Types index - exports all type modules
 */

// Core types
export type { AIModel, AIProvider, LogLevel } from "./core";
export type { AICredentials } from "./core";

// Configuration types
export type {
  AIAdvancedOptions,
  OpenAIModelConfig,
  AnthropicModelConfig,
  OllamaModelConfig,
  VectorSearchConfig,
  AIConfig,
  AIPluginOptions,
} from "./config";

// Function types
export type {
  FunctionParameter,
  AIFunction,
  FunctionResult,
} from "./functions";
export { QuickFunctions, createFunction } from "./functions";

// Result types
export type {
  SummaryResult,
  EmbeddingResult,
  AIProcessingStats,
  AIError,
} from "./results";

// Search types
export type { SearchResult, SemanticSearchOptions } from "./search";
export { isSearchResult } from "./search";

// Model types
export type {
  AIDocumentMethods,
  AIModelStatics,
  AIDocument,
  AIModelType,
  WithAI,
  WithAIDocument,
} from "./models";
export { hasAIMethods, hasAIDocumentMethods } from "./models";
