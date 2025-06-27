/**
 * Base provider interface for AI operations
 */

import { Document } from "mongoose";
import {
  AICredentials,
  SummaryResult,
  EmbeddingResult,
  AIAdvancedOptions,
  AIFunction,
  FunctionResult,
  LogLevel,
} from "../types";

/**
 * Base AI provider interface
 */
export interface AIProviderInterface {
  /**
   * Generate summary for document
   */
  summarize(
    document: Record<string, any>,
    customPrompt?: string,
    functions?: AIFunction[]
  ): Promise<SummaryResult>;

  /**
   * Generate embedding for text
   */
  generateEmbedding(text: string): Promise<EmbeddingResult>;

  /**
   * Get provider information
   */
  getProviderInfo(): {
    name: string;
    version: string;
    models: any;
    advanced: any;
  };
}

/**
 * Base provider class with common functionality
 */
export abstract class BaseProvider implements AIProviderInterface {
  protected readonly advanced: Required<AIAdvancedOptions>;

  constructor(
    credentials: AICredentials,
    advancedOptions: AIAdvancedOptions = {}
  ) {
    this.validateCredentials(credentials);

    this.advanced = {
      maxRetries: advancedOptions.maxRetries ?? 2,
      timeout: advancedOptions.timeout ?? 30000,
      skipOnUpdate: advancedOptions.skipOnUpdate ?? false,
      forceRegenerate: advancedOptions.forceRegenerate ?? false,
      logLevel: advancedOptions.logLevel || "warn",
      continueOnError: advancedOptions.continueOnError ?? true,
      enableFunctions: advancedOptions.enableFunctions ?? false,
    };
  }

  abstract summarize(
    document: Record<string, any>,
    customPrompt?: string,
    functions?: AIFunction[]
  ): Promise<SummaryResult>;

  abstract generateEmbedding(text: string): Promise<EmbeddingResult>;

  abstract getProviderInfo(): {
    name: string;
    version: string;
    models: any;
    advanced: any;
  };

  /**
   * Execute functions with error handling
   */
  protected async executeFunctions(
    functions: AIFunction[],
    functionCalls: { name: string; arguments: any }[],
    document: Document
  ): Promise<FunctionResult[]> {
    const results: FunctionResult[] = [];

    for (const call of functionCalls) {
      const func = functions.find((f) => f.name === call.name);
      if (!func) {
        results.push({
          name: call.name,
          success: false,
          error: "Function not found",
          executedAt: new Date(),
        });
        continue;
      }

      try {
        // Execute the function handler
        const result = await func.handler(call.arguments || {}, document);

        results.push({
          name: call.name,
          success: true,
          result: call.arguments, // Store the arguments that were applied
          executedAt: new Date(),
        });

        this.log(
          "debug",
          `Function ${call.name} executed successfully. Document updated.`
        );
      } catch (error) {
        results.push({
          name: call.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          executedAt: new Date(),
        });

        this.log("error", `Function ${call.name} failed:`, error);
      }
    }

    return results;
  }

  /**
   * Convert document to clean text
   */
  protected prepareText(document: Record<string, any>): string {
    if (!document || typeof document !== "object") {
      return "";
    }

    const clean = { ...document };

    // Remove common system fields
    const systemFields = ["_id", "__v", "createdAt", "updatedAt", "id"];
    systemFields.forEach((field) => delete clean[field]);

    try {
      return JSON.stringify(clean, null, 2)
        .replace(/[{}",[\]]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    } catch (error) {
      this.log("warn", "Failed to stringify document, using fallback");
      return String(document).trim();
    }
  }

  /**
   * Truncate text to specified length
   */
  protected truncateText(text: string, maxLength: number): string {
    if (!text || typeof text !== "string") {
      return "";
    }

    if (text.length <= maxLength) return text;

    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");

    return lastSpace > maxLength * 0.8
      ? truncated.substring(0, lastSpace) + "..."
      : truncated + "...";
  }

  /**
   * Validate credentials
   */
  protected abstract validateCredentials(credentials: AICredentials): void;

  /**
   * Extract error message
   */
  protected getErrorMessage(error: any): string {
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    if (error?.response?.data?.error?.message)
      return error.response.data.error.message;
    return "Unknown error occurred";
  }

  /**
   * Log messages based on level
   */
  protected log(level: LogLevel, message: string, error?: any): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.advanced.logLevel];

    if (levels[level] >= currentLevel) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [mongoose-ai] [${level.toUpperCase()}]`;

      if (error && level === "error") {
        console[level](`${prefix} ${message}`, error);
      } else if (level === "debug" && typeof error !== "undefined") {
        console[level](`${prefix} ${message}`, error);
      } else {
        console[level](`${prefix} ${message}`);
      }
    }
  }
}
