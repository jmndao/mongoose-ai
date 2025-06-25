/**
 * Core types for mongoose-ai plugin
 */

import { Document, Model } from "mongoose";

export type AIModel = "summary" | "embedding";
export type AIProvider = "openai";
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * AI provider credentials
 */
export interface AICredentials {
  apiKey: string;
  organizationId?: string;
}

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
 * Main AI configuration
 */
export interface AIConfig {
  model: AIModel;
  provider: AIProvider;
  field: string;
  credentials: AICredentials;
  prompt?: string;
  advanced?: AIAdvancedOptions;
  modelConfig?: OpenAIModelConfig;
  /** Fields to include in AI processing */
  includeFields?: string[];
  /** Fields to exclude from AI processing */
  excludeFields?: string[];
}

/**
 * Plugin options
 */
export interface AIPluginOptions {
  ai: AIConfig;
}

/**
 * AI-generated summary result
 */
export interface SummaryResult {
  summary: string;
  generatedAt: Date;
  model: string;
  tokenCount?: number;
  processingTime?: number;
}

/**
 * AI-generated embedding result
 */
export interface EmbeddingResult {
  embedding: number[];
  generatedAt: Date;
  model: string;
  dimensions: number;
  processingTime?: number;
}

/**
 * Semantic search result
 */
export interface SearchResult<T = any> {
  document: T;
  similarity: number;
  metadata?: {
    field: string;
    distance: number;
  };
}

/**
 * Semantic search options
 */
export interface SemanticSearchOptions {
  /** Maximum number of results (default: 10) */
  limit?: number;
  /** Minimum similarity threshold (default: 0.7) */
  threshold?: number;
  /** Include similarity scores (default: true) */
  includeScore?: boolean;
  /** Additional MongoDB query filters */
  filter?: Record<string, any>;
}

/**
 * Processing statistics
 */
export interface AIProcessingStats {
  totalProcessed: number;
  successful: number;
  failed: number;
  averageProcessingTime: number;
  totalTokensUsed?: number;
}

/**
 * AI error information
 */
export interface AIError {
  message: string;
  code: string;
  originalError?: any;
  timestamp: Date;
  retryCount?: number;
}

/**
 * Extended document interface with AI methods
 */
export interface AIDocumentMethods {
  getAIContent(): SummaryResult | EmbeddingResult | null;
  regenerateAI(): Promise<void>;
  calculateSimilarity?(other: any): number;
}

/**
 * Extended model interface with semantic search methods
 */
export interface AIModelStatics {
  semanticSearch(
    query: string,
    options?: SemanticSearchOptions
  ): Promise<SearchResult[]>;
  findSimilar(
    document: any,
    options?: SemanticSearchOptions
  ): Promise<SearchResult[]>;
  getAIStats?(): AIProcessingStats;
  resetAIStats?(): void;
}

/**
 * Combined AI document type
 */
export type AIDocument<T = {}> = Document<any, any, any> &
  T &
  AIDocumentMethods;

/**
 * Combined AI model type
 */
export type AIModelType<T = {}> = Model<AIDocument<T>> & AIModelStatics;
