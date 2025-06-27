/**
 * OpenAI provider for text processing and embeddings with function calling
 */

import OpenAI from "openai";
import { Document } from "mongoose";
import { BaseProvider } from "./base";
import {
  AICredentials,
  SummaryResult,
  EmbeddingResult,
  AIAdvancedOptions,
  OpenAIModelConfig,
  AIFunction,
  FunctionResult,
} from "../types";

export class OpenAIProvider extends BaseProvider {
  private readonly client: OpenAI;
  private readonly config: Required<OpenAIModelConfig>;

  constructor(
    credentials: AICredentials,
    modelConfig: OpenAIModelConfig = {},
    advancedOptions: AIAdvancedOptions = {}
  ) {
    super(credentials, advancedOptions);

    // Set default configurations
    this.config = {
      chatModel: modelConfig.chatModel || "gpt-3.5-turbo",
      embeddingModel: modelConfig.embeddingModel || "text-embedding-3-small",
      maxTokens: modelConfig.maxTokens || 200,
      temperature: modelConfig.temperature || 0.3,
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

      // Prepare function tools for OpenAI
      const tools = this.prepareFunctionTools(functions);

      const requestParams: any = {
        model: this.config.chatModel,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: text },
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      };

      // Only add tools if functions are enabled and available
      if (tools.length > 0 && this.advanced.enableFunctions) {
        requestParams.tools = tools;
        requestParams.tool_choice = "auto";
      }

      const response = await this.client.chat.completions.create(requestParams);

      const choice = response.choices[0];
      if (!choice) {
        throw new Error("No response choice received from OpenAI");
      }

      let summary = choice.message?.content?.trim() || "";
      let functionResults: FunctionResult[] = [];

      // Handle tool calls if present
      const toolCalls = choice.message?.tool_calls;
      if (
        toolCalls &&
        toolCalls.length > 0 &&
        functions &&
        this.advanced.enableFunctions
      ) {
        // Execute functions and collect results
        functionResults = await this.executeFunctions(
          functions,
          toolCalls.map((call) => ({
            name: call.function.name,
            arguments: JSON.parse(call.function.arguments || "{}"),
          })),
          document as Document
        );
      }

      // If no summary but tool calls exist, create a default summary
      if (!summary && functionResults.length > 0) {
        summary = "Analysis completed with automated classifications applied.";
        this.log(
          "info",
          "No summary content provided, using default summary due to tool calls"
        );
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
        tokenCount: response.usage?.total_tokens,
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
   * Prepare function tools for OpenAI API
   */
  private prepareFunctionTools(functions?: AIFunction[]): any[] {
    if (!functions || !this.advanced.enableFunctions) {
      return [];
    }

    return functions.map((func) => {
      // Clean parameters: remove 'required' property from individual parameters
      const cleanParameters: Record<string, any> = {};
      const requiredFields: string[] = [];

      Object.entries(func.parameters).forEach(([key, param]) => {
        // Extract required status before cleaning
        if (param.required === true) {
          requiredFields.push(key);
        }

        // Remove the 'required' property from the parameter definition
        const { required, ...cleanParam } = param;
        cleanParameters[key] = cleanParam;
      });

      return {
        type: "function" as const,
        function: {
          name: func.name,
          description: func.description,
          parameters: {
            type: "object" as const,
            properties: cleanParameters,
            required: requiredFields,
          },
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
   * Get provider information
   */
  getProviderInfo() {
    return {
      name: "OpenAI",
      version: "1.1.0",
      models: this.config,
      advanced: this.advanced,
    };
  }
}
