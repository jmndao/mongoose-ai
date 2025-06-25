/**
 * OpenAI provider for text processing and embeddings
 */

import OpenAI from "openai";
import {
  AICredentials,
  SummaryResult,
  EmbeddingResult,
  AIAdvancedOptions,
  OpenAIModelConfig,
  LogLevel,
} from "../types";

export class OpenAIProvider {
  private readonly client: OpenAI;
  private readonly config: Required<OpenAIModelConfig>;
  private readonly advanced: Required<AIAdvancedOptions>;

  constructor(
    credentials: AICredentials,
    modelConfig: OpenAIModelConfig = {},
    advancedOptions: AIAdvancedOptions = {}
  ) {
    this.validateCredentials(credentials);

    // Set default configurations
    this.config = {
      chatModel: modelConfig.chatModel || "gpt-3.5-turbo",
      embeddingModel: modelConfig.embeddingModel || "text-embedding-3-small",
      maxTokens: modelConfig.maxTokens || 200,
      temperature: modelConfig.temperature || 0.3,
    };

    this.advanced = {
      maxRetries: advancedOptions.maxRetries ?? 2,
      timeout: advancedOptions.timeout ?? 30000,
      skipOnUpdate: advancedOptions.skipOnUpdate ?? false,
      forceRegenerate: advancedOptions.forceRegenerate ?? false,
      logLevel: advancedOptions.logLevel || "warn",
      continueOnError: advancedOptions.continueOnError ?? true,
    };

    try {
      this.client = new OpenAI({
        apiKey: credentials.apiKey,
        organization: credentials.organizationId,
        timeout: this.advanced.timeout,
        maxRetries: this.advanced.maxRetries,
      });

      this.log("info", "OpenAI provider initialized successfully");
    } catch (error) {
      throw new Error(
        `Failed to initialize OpenAI client: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Generate summary for document
   */
  async summarize(
    document: Record<string, any>,
    customPrompt?: string
  ): Promise<SummaryResult> {
    const startTime = Date.now();

    try {
      const text = this.prepareText(document);

      if (!text.trim()) {
        throw new Error("No content to summarize");
      }

      const prompt =
        customPrompt || "Summarize this content in 2-3 clear sentences:";

      this.log("debug", `Generating summary for ${text.length} characters`);

      const response = await this.client.chat.completions.create({
        model: this.config.chatModel,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: text },
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const summary = response.choices[0]?.message?.content?.trim();

      if (!summary) {
        throw new Error("Failed to generate summary - no content returned");
      }

      const processingTime = Date.now() - startTime;
      this.log("info", `Summary generated in ${processingTime}ms`);

      return {
        summary,
        generatedAt: new Date(),
        model: this.config.chatModel,
        tokenCount: response.usage?.total_tokens,
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log(
        "error",
        `Summary generation failed after ${processingTime}ms:`,
        error
      );
      throw new Error(
        `Summary generation failed: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const startTime = Date.now();

    try {
      if (!text || typeof text !== "string") {
        throw new Error("Text is required for embedding");
      }

      const processedText = this.truncateText(text, 8000);
      this.log(
        "debug",
        `Generating embedding for ${processedText.length} characters`
      );

      const response = await this.client.embeddings.create({
        model: this.config.embeddingModel,
        input: processedText,
      });

      const embedding = response.data[0]?.embedding;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error(
          "Failed to generate embedding - no embedding data returned"
        );
      }

      const processingTime = Date.now() - startTime;
      this.log("info", `Embedding generated in ${processingTime}ms`);

      return {
        embedding,
        generatedAt: new Date(),
        model: this.config.embeddingModel,
        dimensions: embedding.length,
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log(
        "error",
        `Embedding generation failed after ${processingTime}ms:`,
        error
      );
      throw new Error(
        `Embedding generation failed: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Convert document to clean text
   */
  private prepareText(document: Record<string, any>): string {
    if (!document || typeof document !== "object") {
      return "";
    }

    const clean = { ...document };

    // Remove common system fields
    const systemFields = ["_id", "__v", "createdAt", "updatedAt", "id"];
    systemFields.forEach((field) => delete clean[field]);

    try {
      return JSON.stringify(clean, null, 2)
        .replace(/[{}",\[\]]/g, " ")
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
  private truncateText(text: string, maxLength: number): string {
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
  private validateCredentials(credentials: AICredentials): void {
    if (!credentials || typeof credentials !== "object") {
      throw new Error("Credentials object is required");
    }

    if (!credentials.apiKey || typeof credentials.apiKey !== "string") {
      throw new Error("OpenAI API key is required");
    }

    if (!credentials.apiKey.startsWith("sk-")) {
      throw new Error('Invalid OpenAI API key format - must start with "sk-"');
    }

    if (credentials.apiKey.length < 20) {
      throw new Error("OpenAI API key appears to be invalid - too short");
    }
  }

  /**
   * Extract error message
   */
  private getErrorMessage(error: any): string {
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
  private log(level: LogLevel, message: string, error?: any): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.advanced.logLevel];

    if (levels[level] >= currentLevel) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [mongoose-ai:openai] [${level.toUpperCase()}]`;

      if (error && level === "error") {
        console[level](`${prefix} ${message}`, error);
      } else {
        console[level](`${prefix} ${message}`);
      }
    }
  }

  /**
   * Get provider information
   */
  getProviderInfo() {
    return {
      name: "OpenAI",
      version: "1.0.0",
      models: this.config,
      advanced: this.advanced,
    };
  }
}
