/**
 * Main mongoose-ai plugin
 */

import { Schema, Document } from "mongoose";
import { OpenAIProvider } from "./providers/openai";
import {
  AIPluginOptions,
  AIConfig,
  SearchResult,
  SemanticSearchOptions,
} from "./types";

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

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

  // Check if field already exists in schema
  if (schema.paths[config.field] || schema.virtuals[config.field]) {
    throw new Error(`Field "${config.field}" already exists in schema`);
  }

  // Initialize provider
  let provider: OpenAIProvider;
  try {
    provider = new OpenAIProvider(
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

    // Add semantic search static methods
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

        // Find documents with embeddings
        const docs = await this.find({
          ...filter,
          [`${config.field}.embedding`]: { $exists: true },
        });

        const results: SearchResult[] = [];

        for (const doc of docs) {
          const docEmbedding = doc[config.field]?.embedding;
          if (!docEmbedding) continue;

          const similarity = cosineSimilarity(queryEmbedding, docEmbedding);

          if (similarity >= threshold) {
            results.push({
              document: doc,
              similarity,
              metadata: {
                field: config.field,
                distance: 1 - similarity,
              },
            });
          }
        }

        // Sort by similarity and limit
        return results
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit);
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
        const docs = await this.find({
          ...filter,
          _id: { $ne: document._id },
          [`${config.field}.embedding`]: { $exists: true },
        });

        const results: SearchResult[] = [];

        for (const doc of docs) {
          const docEmbedding = doc[config.field]?.embedding;
          if (!docEmbedding) continue;

          const similarity = cosineSimilarity(refEmbedding, docEmbedding);

          if (similarity >= threshold) {
            results.push({
              document: doc,
              similarity,
              metadata: {
                field: config.field,
                distance: 1 - similarity,
              },
            });
          }
        }

        return results
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit);
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
 * Process AI for document
 */
async function processAI(
  document: Document,
  config: AIConfig,
  provider: OpenAIProvider
): Promise<void> {
  const docData = document.toObject();

  // Remove system fields
  delete docData._id;
  delete docData.__v;
  delete docData.createdAt;
  delete docData.updatedAt;
  delete docData[config.field];

  // Apply field filters
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
    const result = await provider.summarize(processedData, config.prompt);
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
