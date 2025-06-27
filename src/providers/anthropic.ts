/**
 * Anthropic provider for text processing with function calling
 */

import { Document } from "mongoose";
import { BaseProvider } from "./base";
import {
  AICredentials,
  SummaryResult,
  EmbeddingResult,
  AIAdvancedOptions,
  AnthropicModelConfig,
  AIFunction,
  FunctionResult,
} from "../types";

export class AnthropicProvider extends BaseProvider {
  private readonly config: Required<AnthropicModelConfig>;
  private readonly apiKey: string;

  constructor(
    credentials: AICredentials,
    modelConfig: AnthropicModelConfig = {},
    advancedOptions: AIAdvancedOptions = {}
  ) {
    super(credentials, advancedOptions);

    this.apiKey = credentials.apiKey;

    // Set default configurations
    this.config = {
      chatModel: modelConfig.chatModel || "claude-3-haiku-20240307",
      maxTokens: modelConfig.maxTokens || 200,
      temperature: modelConfig.temperature || 0.3,
    };

    this.log("info", "Anthropic provider initialized successfully");
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

      // Prepare function tools for Anthropic
      const tools = this.prepareFunctionTools(functions);

      const requestBody: any = {
        model: this.config.chatModel,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: "user",
            content: `${prompt}\n\nContent to analyze:\n${text}`,
          },
        ],
      };

      // Only add tools if functions are enabled and tools exist
      if (tools.length > 0 && this.advanced.enableFunctions) {
        requestBody.tools = tools;
      }

      const response = await this.makeAnthropicRequest(requestBody);

      // Extract text content
      const textContent = response.content?.find((c: any) => c.type === "text");
      let summary = textContent?.text?.trim() || "";

      // Handle tool use
      const functionResults: FunctionResult[] = [];
      const toolUse =
        response.content?.filter((c: any) => c.type === "tool_use") || [];

      if (toolUse.length > 0 && functions && this.advanced.enableFunctions) {
        for (const use of toolUse) {
          try {
            const func = functions.find((f) => f.name === use.name);

            if (!func) {
              functionResults.push({
                name: use.name,
                success: false,
                error: "Function not found",
                executedAt: new Date(),
              });
              continue;
            }

            // Execute the function directly on the document
            const docInstance = document as any as Document;
            await func.handler(use.input || {}, docInstance);

            functionResults.push({
              name: use.name,
              success: true,
              result: use.input,
              executedAt: new Date(),
            });

            this.log(
              "debug",
              `Function ${use.name} executed successfully. Document updated.`
            );
          } catch (error) {
            functionResults.push({
              name: use.name,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
              executedAt: new Date(),
            });
            this.log("error", `Function ${use.name} failed:`, error);
          }
        }

        // If we have tool use but no text summary, provide a default summary
        if (!summary && functionResults.length > 0) {
          summary =
            "Analysis completed with automated classifications applied.";
          this.log(
            "info",
            "No summary content provided, using default summary due to tool calls"
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
        tokenCount:
          response.usage?.input_tokens + response.usage?.output_tokens,
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
   * Generate embedding for text - Note: Anthropic doesn't provide embeddings
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    throw new Error(
      "Anthropic provider does not support embeddings. Use OpenAI provider for embedding models."
    );
  }

  /**
   * Make API request to Anthropic
   */
  private async makeAnthropicRequest(body: any): Promise<any> {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
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
          // If we can't parse the error, use the raw text
          errorData = { error: { message: errorText } };
        }

        const errorMessage =
          errorData.error?.message ||
          errorData.message ||
          `HTTP ${response.status} ${response.statusText}`;

        throw new Error(`Anthropic API error: ${errorMessage}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Request failed: ${String(error)}`);
    }
  }

  /**
   * Prepare function tools for Anthropic API
   */
  private prepareFunctionTools(functions?: AIFunction[]): any[] {
    if (!functions || !this.advanced.enableFunctions) {
      return [];
    }

    return functions.map((func) => {
      // Clean parameters: remove 'required' property from individual parameters
      const cleanProperties: Record<string, any> = {};
      const requiredFields: string[] = [];

      Object.entries(func.parameters).forEach(([key, param]) => {
        // Extract required status before cleaning
        if (param.required === true) {
          requiredFields.push(key);
        }

        // Remove the 'required' property from the parameter definition
        const { required, ...cleanParam } = param;
        cleanProperties[key] = cleanParam;
      });

      return {
        name: func.name,
        description: func.description,
        input_schema: {
          type: "object",
          properties: cleanProperties,
          required: requiredFields,
        },
      };
    });
  }

  /**
   * Validate credentials
   */
  protected validateCredentials(credentials: AICredentials): void {
    if (!credentials || typeof credentials !== "object") {
      throw new Error("Credentials object is required");
    }

    if (!credentials.apiKey || typeof credentials.apiKey !== "string") {
      throw new Error("Anthropic API key is required");
    }

    if (credentials.apiKey.length < 20) {
      throw new Error("Anthropic API key appears to be invalid - too short");
    }

    // More specific validation for Anthropic keys
    if (
      !credentials.apiKey.startsWith("sk-ant-") &&
      credentials.apiKey.length < 40
    ) {
      this.log(
        "warn",
        "Anthropic API key format may be invalid - expected to start with 'sk-ant-'"
      );
    }
  }

  /**
   * Get provider information
   */
  getProviderInfo() {
    return {
      name: "Anthropic",
      version: "1.1.0",
      models: this.config,
      advanced: this.advanced,
    };
  }
}

/**
 * Example usage with Anthropic-optimized configuration
 */
export const anthropicOptimizedConfig = {
  // Anthropic-specific prompt that works well with Claude
  prompt: `Please analyze this content and provide a concise summary in 2-3 sentences. 

Additionally, use the available tools to:
1. Set the sentiment classification (positive, negative, or neutral)
2. Assign a priority score from 1-5 based on importance
3. Add relevant tags for categorization

Make sure to use all the available tools to classify this content.`,

  // Anthropic-optimized settings
  advanced: {
    enableFunctions: true,
    logLevel: "info" as const, // Less verbose than debug
    maxRetries: 2,
    timeout: 30000, // Anthropic can be slower than OpenAI
    continueOnError: true,
  },

  // Use newer Claude model for better function calling
  modelConfig: {
    chatModel: "claude-3-sonnet-20240229", // Better function calling than Haiku
    maxTokens: 300, // Bit more tokens for function calling
    temperature: 0.1, // Lower temperature for more consistent function calling
  },
};
