/**
 * Main mongoose-ai plugin with MongoDB Vector Search and Ollama support
 */

import { Schema, Document } from "mongoose";
import { createProvider, validateProviderModel } from "./providers/factory";
import { AIProviderInterface } from "./providers/base";
import {
  AIPluginOptions,
  AIConfig,
  SearchResult,
  SemanticSearchOptions,
} from "./types";
import {
  detectVectorSearchSupport,
  createVectorIndex,
  performVectorSearch,
  performInMemorySearch,
  cosineSimilarity,
} from "./utils/vector-search";

/**
 * Track vector search capability per model
 */
const vectorSearchCache = new WeakMap<any, boolean>();

/**
 * Main plugin function
 */
export function aiPlugin(schema: Schema, options: AIPluginOptions): void {
  const config = options.ai;

  // Validate config
  if (!config.model || !["summary", "embedding"].includes(config.model)) {
    throw new Error("Valid model (summary|embedding) required");
  }

  if (
    !config.provider ||
    !["openai", "anthropic", "ollama"].includes(config.provider)
  ) {
    throw new Error("Valid provider (openai|anthropic|ollama) required");
  }

  if (
    !config.field ||
    typeof config.field !== "string" ||
    config.field.trim() === ""
  ) {
    throw new Error("Field name required");
  }

  if (
    !config.credentials?.apiKey ||
    typeof config.credentials.apiKey !== "string" ||
    config.credentials.apiKey.trim() === ""
  ) {
    throw new Error("API key required");
  }

  // Validate provider supports model
  validateProviderModel(config.provider, config.model);

  // Check if field already exists in schema
  if (schema.paths[config.field] || schema.virtuals[config.field]) {
    throw new Error(`Field "${config.field}" already exists in schema`);
  }

  // Initialize provider
  let provider: AIProviderInterface;
  try {
    provider = createProvider(
      config.provider,
      config.credentials,
      config.modelConfig,
      config.advanced
    );
  } catch (error) {
    throw new Error(
      `Failed to initialize AI provider: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  // Set default vector search config
  const vectorSearchConfig = {
    enabled: true,
    indexName: "vector_index",
    autoCreateIndex: true,
    similarity: "cosine" as const,
    ...config.vectorSearch,
  };

  // Add field to schema based on model type
  if (config.model === "summary") {
    schema.add({
      [config.field]: {
        type: {
          summary: { type: String },
          generatedAt: { type: Date },
          model: { type: String },
          tokenCount: { type: Number },
          processingTime: { type: Number },
          functionResults: [
            {
              name: { type: String },
              success: { type: Boolean },
              result: { type: Schema.Types.Mixed },
              error: { type: String },
              executedAt: { type: Date },
            },
          ],
        },
        default: undefined,
      },
    });
  } else if (config.model === "embedding") {
    schema.add({
      [config.field]: {
        type: {
          embedding: { type: [Number] },
          generatedAt: { type: Date },
          model: { type: String },
          dimensions: { type: Number },
          processingTime: { type: Number },
          functionResults: [
            {
              name: { type: String },
              success: { type: Boolean },
              result: { type: Schema.Types.Mixed },
              error: { type: String },
              executedAt: { type: Date },
            },
          ],
        },
        default: undefined,
      },
    });
  }

  // Add instance methods
  schema.methods.getAIContent = function (): any {
    return (this as any)[config.field] || null;
  };

  schema.methods.regenerateAI = async function (): Promise<void> {
    try {
      (this as any)[config.field] = undefined;
      await processAI(this as Document, config, provider);
    } catch (error) {
      throw new Error(
        `Failed to regenerate AI content: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Add calculateSimilarity method for embedding models
  if (config.model === "embedding") {
    schema.methods.calculateSimilarity = function (other: any): number {
      const thisEmbedding = (this as any)[config.field]?.embedding;
      const otherEmbedding = other[config.field]?.embedding;

      if (!thisEmbedding || !otherEmbedding) {
        return 0;
      }

      return cosineSimilarity(thisEmbedding, otherEmbedding);
    };

    // Add semantic search static methods with vector search support
    schema.statics.semanticSearch = async function (
      query: string,
      options: SemanticSearchOptions = {}
    ): Promise<SearchResult[]> {
      const { limit = 10, threshold = 0.7, filter = {} } = options;

      if (!query || typeof query !== "string") {
        throw new Error("Query string is required");
      }

      try {
        // Generate query embedding
        const queryResult = await provider.generateEmbedding(query);
        const queryEmbedding = queryResult.embedding;

        // Check if we should use vector search
        const shouldUseVectorSearch = await determineSearchMethod(
          this,
          options,
          vectorSearchConfig
        );

        if (shouldUseVectorSearch) {
          // Ensure vector index exists
          await ensureVectorIndex(
            this,
            config.field,
            queryEmbedding.length,
            vectorSearchConfig
          );

          return await performVectorSearch(this, queryEmbedding, config.field, {
            ...options,
            indexName: vectorSearchConfig.indexName,
            numCandidates: options.numCandidates || limit * 10,
          });
        } else {
          // Fall back to in-memory search
          return await performInMemorySearch(
            this,
            queryEmbedding,
            config.field,
            options
          );
        }
      } catch (error) {
        throw new Error(
          `Semantic search failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    };

    schema.statics.findSimilar = async function (
      document: any,
      options: SemanticSearchOptions = {}
    ): Promise<SearchResult[]> {
      if (!document) {
        throw new Error("Reference document is required");
      }

      const refEmbedding = document[config.field]?.embedding;
      if (!refEmbedding) {
        throw new Error("Document has no embedding");
      }

      const { limit = 10, threshold = 0.7, filter = {} } = options;

      try {
        // Check if we should use vector search
        const shouldUseVectorSearch = await determineSearchMethod(
          this,
          options,
          vectorSearchConfig
        );

        if (shouldUseVectorSearch) {
          // Ensure vector index exists
          await ensureVectorIndex(
            this,
            config.field,
            refEmbedding.length,
            vectorSearchConfig
          );

          return await performVectorSearch(this, refEmbedding, config.field, {
            ...options,
            filter: { ...filter, _id: { $ne: document._id } },
            indexName: vectorSearchConfig.indexName,
            numCandidates: options.numCandidates || limit * 10,
          });
        } else {
          // Fall back to in-memory search
          return await performInMemorySearch(this, refEmbedding, config.field, {
            ...options,
            filter: { ...filter, _id: { $ne: document._id } },
          });
        }
      } catch (error) {
        throw new Error(
          `Find similar failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    };
  }

  // Add pre-save middleware
  schema.pre("save", async function (this: Document, next) {
    try {
      // Skip if skipOnUpdate is true and document is not new
      if (config.advanced?.skipOnUpdate && !this.isNew) {
        return next();
      }

      // Skip if AI content exists and forceRegenerate is false
      if ((this as any)[config.field] && !config.advanced?.forceRegenerate) {
        return next();
      }

      // Skip if no meaningful content
      if (!hasContent(this, config)) {
        return next();
      }

      await processAI(this as Document, config, provider);
      next();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown AI processing error";

      if (config.advanced?.continueOnError !== false) {
        console.warn(`AI processing failed: ${errorMessage}`);
        next(); // Continue save without AI
      } else {
        next(new Error(`AI processing failed: ${errorMessage}`));
      }
    }
  });
}

/**
 * Determine whether to use vector search or in-memory search
 */
async function determineSearchMethod(
  model: any,
  options: SemanticSearchOptions,
  vectorSearchConfig: any
): Promise<boolean> {
  // If explicitly disabled in config
  if (vectorSearchConfig.enabled === false) {
    return false;
  }

  // If explicitly specified in options
  if (options.useVectorSearch !== undefined) {
    return options.useVectorSearch;
  }

  // Check cache first
  if (vectorSearchCache.has(model)) {
    return vectorSearchCache.get(model)!;
  }

  // Detect vector search support
  try {
    const isSupported = await detectVectorSearchSupport(model);
    vectorSearchCache.set(model, isSupported);
    return isSupported;
  } catch (error) {
    vectorSearchCache.set(model, false);
    return false;
  }
}

/**
 * Ensure vector index exists for the model
 */
async function ensureVectorIndex(
  model: any,
  fieldName: string,
  dimensions: number,
  vectorSearchConfig: any
): Promise<void> {
  try {
    await createVectorIndex(model, fieldName, dimensions, vectorSearchConfig);
  } catch (error) {
    console.warn(
      `Failed to create vector index: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    // Don't throw - fall back to in-memory search
  }
}

/**
 * Process AI for document
 */
async function processAI(
  document: Document,
  config: AIConfig,
  provider: AIProviderInterface
): Promise<void> {
  const docData = document.toObject();

  delete docData._id;
  delete docData.__v;
  delete docData.createdAt;
  delete docData.updatedAt;
  delete docData[config.field];

  let processedData = { ...docData };

  if (config.includeFields && config.includeFields.length > 0) {
    processedData = {};
    config.includeFields.forEach((field) => {
      if (docData[field] !== undefined) {
        processedData[field] = docData[field];
      }
    });
  }

  if (config.excludeFields && config.excludeFields.length > 0) {
    config.excludeFields.forEach((field) => {
      delete processedData[field];
    });
  }

  if (config.model === "summary") {
    const functionsWithDocument = config.functions?.map((func) => ({
      ...func,
      handler: (args: any, _: Document) => func.handler(args, document),
    }));

    const result = await provider.summarize(
      processedData,
      config.prompt,
      functionsWithDocument
    );
    (document as any)[config.field] = result;
  } else if (config.model === "embedding") {
    const text = JSON.stringify(processedData);
    const result = await provider.generateEmbedding(text);
    (document as any)[config.field] = result;
  }
}

/**
 * Check if document has content to process
 */
function hasContent(document: Document, config: AIConfig): boolean {
  const docObj = document.toObject();
  delete docObj._id;
  delete docObj.__v;
  delete docObj.createdAt;
  delete docObj.updatedAt;
  delete docObj[config.field];

  // Apply field filters to check content
  let processedData = { ...docObj };

  if (config.includeFields && config.includeFields.length > 0) {
    processedData = {};
    config.includeFields.forEach((field) => {
      if (docObj[field] !== undefined) {
        processedData[field] = docObj[field];
      }
    });
  }

  if (config.excludeFields && config.excludeFields.length > 0) {
    config.excludeFields.forEach((field) => {
      delete processedData[field];
    });
  }

  const content = JSON.stringify(processedData);
  return content.length > 20; // More than just "{}"
}
