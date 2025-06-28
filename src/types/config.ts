/**
 * Configuration types
 */

import { AIModel, AIProvider, AICredentials, LogLevel } from "./core";
import { AIFunction } from "./functions";

/**
 * Advanced configuration options
 */
export interface AIAdvancedOptions {
  /** Maximum retries for failed API calls (default: 2) */
  maxRetries?: number;
  /** Timeout for API calls in milliseconds (default: 30000) */
  timeout?: number;
  /** Skip AI processing on document updates (default: false) */
  skipOnUpdate?: boolean;
  /** Force regeneration even if AI content exists (default: false) */
  forceRegenerate?: boolean;
  /** Log level for debugging (default: 'warn') */
  logLevel?: LogLevel;
  /** Continue saving document if AI processing fails (default: true) */
  continueOnError?: boolean;
  /** Enable function calling (default: false) */
  enableFunctions?: boolean;
}

/**
 * OpenAI specific model configuration
 */
export interface OpenAIModelConfig {
  /** Chat model for summaries (default: 'gpt-3.5-turbo') */
  chatModel?: string;
  /** Embedding model (default: 'text-embedding-3-small') */
  embeddingModel?: string;
  /** Max tokens for summaries (default: 200) */
  maxTokens?: number;
  /** Temperature for text generation (default: 0.3) */
  temperature?: number;
}

/**
 * Anthropic specific model configuration
 */
export interface AnthropicModelConfig {
  /** Chat model for summaries (default: 'claude-3-haiku-20240307') */
  chatModel?: string;
  /** Max tokens for summaries (default: 200) */
  maxTokens?: number;
  /** Temperature for text generation (default: 0.3) */
  temperature?: number;
}

/**
 * Ollama specific model configuration
 */
export interface OllamaModelConfig {
  /** Chat model for summaries (default: 'llama3.2') */
  chatModel?: string;
  /** Embedding model (default: 'nomic-embed-text') */
  embeddingModel?: string;
  /** Max tokens for summaries (default: 200) */
  maxTokens?: number;
  /** Temperature for text generation (default: 0.3) */
  temperature?: number;
  /** Ollama server endpoint (default: 'http://localhost:11434') */
  endpoint?: string;
}

/**
 * Vector search configuration
 */
export interface VectorSearchConfig {
  /** Enable MongoDB Vector Search (default: auto-detect) */
  enabled?: boolean;
  /** Vector search index name (default: 'vector_index') */
  indexName?: string;
  /** Auto-create vector index if not exists (default: true) */
  autoCreateIndex?: boolean;
  /** Vector index similarity metric (default: 'cosine') */
  similarity?: "cosine" | "euclidean" | "dotProduct";
}

/**
 * Main AI configuration
 */
export interface AIConfig {
  model: AIModel;
  provider: AIProvider;
  field: string;
  credentials: AICredentials;
  prompt?: string;
  advanced?: AIAdvancedOptions;
  modelConfig?: OpenAIModelConfig | AnthropicModelConfig | OllamaModelConfig;
  vectorSearch?: VectorSearchConfig;
  /** Fields to include in AI processing */
  includeFields?: string[];
  /** Fields to exclude from AI processing */
  excludeFields?: string[];
  /** Functions to make available to AI */
  functions?: AIFunction[];
}

/**
 * Plugin options
 */
export interface AIPluginOptions {
  ai: AIConfig;
}
