/**
 * Result and response types
 */

import { FunctionResult } from "./functions";

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
