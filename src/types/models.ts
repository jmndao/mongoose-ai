/**
 * Model and document extension types
 */

import { Document, Model } from "mongoose";
import { SummaryResult, EmbeddingResult, AIProcessingStats } from "./results";
import { SearchResult, SemanticSearchOptions } from "./search";

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
