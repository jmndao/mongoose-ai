/**
 * Ollama provider for local LLM processing
 */

import { Document } from "mongoose";
import { BaseProvider } from "./base";
import {
  AICredentials,
  SummaryResult,
  EmbeddingResult,
  AIAdvancedOptions,
  OllamaModelConfig,
  AIFunction,
  FunctionResult,
} from "../types";

export class OllamaProvider extends BaseProvider {
  private readonly config: Required<OllamaModelConfig>;
  private readonly endpoint: string;

  constructor(
    credentials: AICredentials,
    modelConfig: OllamaModelConfig = {},
    advancedOptions: AIAdvancedOptions = {}
  ) {
    super(credentials, advancedOptions);

    // Set default configurations
    this.config = {
      chatModel: modelConfig.chatModel || "llama3.2",
      embeddingModel: modelConfig.embeddingModel || "nomic-embed-text",
      maxTokens: modelConfig.maxTokens || 200,
      temperature: modelConfig.temperature || 0.3,
      endpoint: modelConfig.endpoint || "http://localhost:11434",
    };

    this.endpoint = this.config.endpoint;

    this.log("info", "Ollama provider initialized successfully");
  }

  /**
   * Generate summary for document with optional function calling
   */
  async summarize(
    document: Record<string, any>,
    customPrompt?: string,
    functions?: AIFunction[]
  ): Promise<SummaryResult> {
    const startTime = Date.now();

    try {
      const text = this.prepareText(document);

      if (!text.trim()) {
        throw new Error("No content to summarize");
      }

      const prompt =
        customPrompt || "Summarize this content in 2-3 clear sentences:";

      // Prepare the full prompt
      let fullPrompt = `${prompt}\n\nContent to analyze:\n${text}`;

      // Add function calling instructions if functions are provided
      let functionResults: FunctionResult[] = [];
      if (functions && functions.length > 0 && this.advanced.enableFunctions) {
        const functionInstructions =
          this.prepareFunctionInstructions(functions);
        fullPrompt += `\n\n${functionInstructions}`;
      }

      const requestBody = {
        model: this.config.chatModel,
        prompt: fullPrompt,
        options: {
          num_predict: this.config.maxTokens,
          temperature: this.config.temperature,
        },
        stream: false,
      };

      const response = await this.makeOllamaRequest(
        "/api/generate",
        requestBody
      );

      let summary = response.response?.trim() || "";

      // Handle function calling if enabled
      if (functions && functions.length > 0 && this.advanced.enableFunctions) {
        functionResults = await this.parseFunctionCalls(
          summary,
          functions,
          document as Document
        );

        // If functions were called but no summary, provide default
        if (!summary && functionResults.length > 0) {
          summary =
            "Analysis completed with automated classifications applied.";
          this.log(
            "info",
            "No summary content provided, using default summary due to function calls"
          );
        }
      }

      if (!summary) {
        throw new Error("Failed to generate summary - no content returned");
      }

      const processingTime = Date.now() - startTime;
      this.log("info", `Summary generated in ${processingTime}ms`);

      return {
        summary,
        generatedAt: new Date(),
        model: this.config.chatModel,
        tokenCount: this.estimateTokenCount(summary),
        processingTime,
        ...(functionResults.length > 0 && { functionResults }),
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

      const requestBody = {
        model: this.config.embeddingModel,
        prompt: processedText,
      };

      const response = await this.makeOllamaRequest(
        "/api/embeddings",
        requestBody
      );

      const embedding = response.embedding;

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
   * Make API request to Ollama
   */
  private async makeOllamaRequest(endpoint: string, body: any): Promise<any> {
    try {
      const url = `${this.endpoint}${endpoint}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.advanced.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any = {};

        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }

        const errorMessage =
          errorData.error?.message ||
          errorData.message ||
          `HTTP ${response.status} ${response.statusText}`;

        throw new Error(`Ollama API error: ${errorMessage}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Ollama request timeout - is Ollama running?");
        }
        if (error.message.includes("fetch")) {
          throw new Error(
            "Cannot connect to Ollama - is it running on " + this.endpoint + "?"
          );
        }
        throw error;
      }
      throw new Error(`Request failed: ${String(error)}`);
    }
  }

  /**
   * Prepare function calling instructions for Ollama
   */
  private prepareFunctionInstructions(functions: AIFunction[]): string {
    let instructions = "\nAvailable actions you can perform:\n";

    functions.forEach((func, index) => {
      instructions += `${index + 1}. ${func.name}: ${func.description}\n`;

      Object.entries(func.parameters).forEach(([key, param]) => {
        instructions += `   - ${key}: ${param.description}`;
        if (param.enum) {
          instructions += ` (options: ${param.enum.join(", ")})`;
        }
        instructions += "\n";
      });
    });

    instructions +=
      "\nAfter your summary, if appropriate, specify actions using this format:\n";
    instructions += "ACTIONS:\n";
    instructions += "- function_name: parameter_value\n";
    instructions += "- another_function: another_value\n";

    return instructions;
  }

  /**
   * Parse function calls from Ollama response
   */
  private async parseFunctionCalls(
    response: string,
    functions: AIFunction[],
    document: Document
  ): Promise<FunctionResult[]> {
    const results: FunctionResult[] = [];

    try {
      // Look for ACTIONS section in response
      const actionsMatch = response.match(/ACTIONS:\s*([\s\S]*?)(?:\n\n|$)/i);
      if (!actionsMatch) {
        return results;
      }

      const actionsText = actionsMatch[1];
      const actionLines = actionsText
        .split("\n")
        .filter((line) => line.trim().startsWith("-"))
        .map((line) => line.replace(/^-\s*/, "").trim());

      for (const actionLine of actionLines) {
        const [functionName, ...valueParts] = actionLine.split(":");
        const value = valueParts.join(":").trim();

        const func = functions.find((f) => f.name === functionName.trim());
        if (!func) {
          results.push({
            name: functionName.trim(),
            success: false,
            error: "Function not found",
            executedAt: new Date(),
          });
          continue;
        }

        try {
          // Simple parameter mapping - could be enhanced
          const args = this.parseSimpleArgs(func, value);
          await func.handler(args, document);

          results.push({
            name: func.name,
            success: true,
            result: args,
            executedAt: new Date(),
          });

          this.log("debug", `Function ${func.name} executed successfully`);
        } catch (error) {
          results.push({
            name: func.name,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            executedAt: new Date(),
          });

          this.log("error", `Function ${func.name} failed:`, error);
        }
      }
    } catch (error) {
      this.log("error", "Function parsing failed:", error);
    }

    return results;
  }

  /**
   * Parse simple function arguments
   */
  private parseSimpleArgs(func: AIFunction, value: string): any {
    const paramKeys = Object.keys(func.parameters);

    if (paramKeys.length === 1) {
      const paramKey = paramKeys[0];
      const param = func.parameters[paramKey];

      if (param.type === "number") {
        return { [paramKey]: parseFloat(value) };
      } else if (param.type === "array") {
        return { [paramKey]: value.split(",").map((v) => v.trim()) };
      } else {
        return { [paramKey]: value };
      }
    }

    // For multiple parameters, expect JSON-like format
    try {
      return JSON.parse(value);
    } catch {
      // Fallback to first parameter
      return { [paramKeys[0]]: value };
    }
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Validate credentials
   */
  protected validateCredentials(credentials: AICredentials): void {
    // Ollama doesn't require API keys, but we need the endpoint
    if (!credentials || typeof credentials !== "object") {
      throw new Error("Credentials object is required");
    }

    // API key is optional for Ollama, but we keep the interface consistent
    if (!credentials.apiKey) {
      credentials.apiKey = "local"; // Placeholder for consistency
    }
  }

  /**
   * Get provider information
   */
  getProviderInfo() {
    return {
      name: "Ollama",
      version: "1.4.0",
      models: this.config,
      advanced: this.advanced,
      endpoint: this.endpoint,
    };
  }
}
