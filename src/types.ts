/**
 * Core types for mongoose-ai plugin
 */

import { Document, Model } from "mongoose";

export type AIModel = "summary" | "embedding";
export type AIProvider = "openai" | "anthropic";
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * AI provider credentials
 */
export interface AICredentials {
  apiKey: string;
  organizationId?: string;
}

/**
 * Function parameter definition
 */
export interface FunctionParameter {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[] | number[];
  items?: FunctionParameter;
  properties?: Record<string, FunctionParameter>;
  required?: boolean;
}

/**
 * Function definition
 */
export interface AIFunction {
  name: string;
  description: string;
  parameters: Record<string, FunctionParameter>;
  handler: (args: any, document: Document) => Promise<void> | void;
}

/**
 * Function execution result
 */
export interface FunctionResult {
  name: string;
  success: boolean;
  result?: any;
  error?: string;
  executedAt: Date;
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
 * Main AI configuration
 */
export interface AIConfig {
  model: AIModel;
  provider: AIProvider;
  field: string;
  credentials: AICredentials;
  prompt?: string;
  advanced?: AIAdvancedOptions;
  modelConfig?: OpenAIModelConfig | AnthropicModelConfig;
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

/**
 * AI-generated summary result
 */
export interface SummaryResult {
  summary: string;
  generatedAt: Date;
  model: string;
  tokenCount?: number;
  processingTime?: number;
  functionResults?: FunctionResult[];
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
  functionResults?: FunctionResult[];
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
export interface AIModelStatics<T = any> {
  semanticSearch(
    query: string,
    options?: SemanticSearchOptions
  ): Promise<SearchResult<T>[]>;
  findSimilar(
    document: T,
    options?: SemanticSearchOptions
  ): Promise<SearchResult<T>[]>;
  getAIStats?(): AIProcessingStats;
  resetAIStats?(): void;
}

/**
 * Combined AI document type
 */
export type AIDocument<T = any> = Document & T & AIDocumentMethods;

/**
 * Combined AI model type
 */
export type AIModelType<T = any> = Model<T> & AIModelStatics<T>;

/**
 * Type helper to add AI methods to existing model type
 */
export type WithAI<TModel extends Model<any>> = TModel & {
  semanticSearch(
    query: string,
    options?: SemanticSearchOptions
  ): Promise<SearchResult<any>[]>;
  findSimilar(
    document: any,
    options?: SemanticSearchOptions
  ): Promise<SearchResult<any>[]>;
};

/**
 * Type helper to add AI methods to existing document type
 */
export type WithAIDocument<TDoc extends Document> = TDoc & {
  getAIContent(): SummaryResult | EmbeddingResult | null;
  regenerateAI(): Promise<void>;
  calculateSimilarity?(other: any): number;
};

/**
 * FIXED Quick function builders
 */
export const QuickFunctions = {
  updateField: (fieldName: string, allowedValues?: string[]): AIFunction => {
    const valueParam: FunctionParameter = {
      type: "string",
      description: `New value for ${fieldName}`,
      required: true,
    };

    if (allowedValues && allowedValues.length > 0) {
      valueParam.enum = allowedValues;
    }

    return {
      name: `update_${fieldName}`,
      description: `Update the ${fieldName} field`,
      parameters: {
        value: valueParam,
      },
      handler: async (args: { value: string }, document: Document) => {
        (document as any)[fieldName] = args.value;
      },
    };
  },

  scoreField: (
    fieldName: string,
    min: number = 0,
    max: number = 10
  ): AIFunction => ({
    name: `score_${fieldName}`,
    description: `Score the ${fieldName} field between ${min} and ${max}`,
    parameters: {
      score: {
        type: "number",
        description: `Score for ${fieldName} (${min}-${max})`,
        required: true,
      },
    },
    handler: async (args: { score: number }, document: Document) => {
      const clampedScore = Math.max(min, Math.min(max, args.score));
      (document as any)[fieldName] = clampedScore;
    },
  }),

  manageTags: (fieldName: string = "tags"): AIFunction => ({
    name: `manage_${fieldName}`,
    description: `Add or remove tags from ${fieldName} array`,
    parameters: {
      action: {
        type: "string",
        description: "Action to perform",
        enum: ["add", "remove", "replace"],
        required: true,
      },
      tags: {
        type: "array",
        description: "Tags to add, remove, or replace with",
        items: { type: "string", description: "Tag name" },
        required: true,
      },
    },
    handler: async (
      args: { action: string; tags: string[] },
      document: Document
    ) => {
      const currentTags = (document as any)[fieldName] || [];

      switch (args.action) {
        case "add":
          (document as any)[fieldName] = [
            ...new Set([...currentTags, ...args.tags]),
          ];
          break;
        case "remove":
          (document as any)[fieldName] = currentTags.filter(
            (tag: string) => !args.tags.includes(tag)
          );
          break;
        case "replace":
          (document as any)[fieldName] = args.tags;
          break;
      }
    },
  }),
};

/**
 * Create a custom function
 */
export function createFunction(
  name: string,
  description: string,
  parameters: Record<string, FunctionParameter>,
  handler: (args: any, document: Document) => Promise<void> | void
): AIFunction {
  return {
    name,
    description,
    parameters,
    handler,
  };
}

/**
 * Check if a model has AI methods
 */
export function hasAIMethods<T>(
  model: Model<T>
): model is Model<T> & AIModelStatics<T> {
  return typeof (model as any).semanticSearch === "function";
}

/**
 * Check if a document has AI methods
 */
export function hasAIDocumentMethods<T extends Document>(
  doc: T
): doc is T & AIDocumentMethods {
  return typeof (doc as any).getAIContent === "function";
}

/**
 * Type guard for semantic search results
 */
export function isSearchResult<T>(obj: any): obj is SearchResult<T> {
  return (
    obj &&
    typeof obj.similarity === "number" &&
    obj.document &&
    typeof obj.metadata === "object"
  );
}
