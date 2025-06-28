/**
 * MongoDB Vector Search utilities
 */

import { Model, FilterQuery } from "mongoose";
import { VectorSearchConfig } from "../types/config";
import { SearchResult, SemanticSearchOptions } from "../types/search";

/**
 * Check if MongoDB Vector Search is available
 */
export async function detectVectorSearchSupport(
  model: Model<any>
): Promise<boolean> {
  try {
    const collection = model.collection;

    // Access database through the collection's db property (native MongoDB driver)
    const db = (collection as any).db;

    if (!db) {
      return false;
    }

    // Check if we're running on MongoDB Atlas or a version that supports vector search
    try {
      const buildInfo = await db.admin().buildInfo();
      const version = buildInfo.version;

      // Vector search requires MongoDB 6.0.11+ or 7.0.2+ and Atlas Search
      const majorVersion = parseInt(version.split(".")[0]);
      if (majorVersion < 6) {
        return false;
      }
    } catch (adminError) {
      // If we can't get build info, we might not have admin privileges
      // Continue with the vector search test
    }

    // Try a simple vector search operation to verify Atlas Search is available
    await model
      .aggregate([
        {
          $vectorSearch: {
            index: "test_detection_index",
            path: "test_field",
            queryVector: [0.1],
            numCandidates: 1,
            limit: 1,
          },
        },
        { $limit: 0 }, // Don't return any results, just test if the operation is supported
      ])
      .exec();

    return true;
  } catch (error) {
    // Vector search not available - this is expected in most cases
    return false;
  }
}

/**
 * Create vector search index for embeddings
 */
export async function createVectorIndex(
  model: Model<any>,
  embeddingField: string,
  dimensions: number,
  config: VectorSearchConfig
): Promise<void> {
  try {
    const collection = model.collection;
    const indexName = config.indexName || "vector_index";

    // Check if listSearchIndexes method exists (Atlas Search feature)
    if (typeof (collection as any).listSearchIndexes !== "function") {
      console.warn(
        "MongoDB Atlas Search is not available. Vector search index creation skipped."
      );
      return;
    }

    // Check if index already exists
    const indexes = await (collection as any).listSearchIndexes().toArray();
    const existingIndex = indexes.find((idx: any) => idx.name === indexName);

    if (existingIndex) {
      console.log(`Vector search index '${indexName}' already exists`);
      return;
    }

    if (!config.autoCreateIndex) {
      console.warn(
        `Vector search index '${indexName}' does not exist and auto-creation is disabled`
      );
      return;
    }

    // Create the vector search index
    const indexDefinition = {
      name: indexName,
      definition: {
        fields: [
          {
            type: "vector",
            path: `${embeddingField}.embedding`,
            numDimensions: dimensions,
            similarity: config.similarity || "cosine",
          },
        ],
      },
    };

    await (collection as any).createSearchIndex(indexDefinition);
    console.log(
      `Created vector search index '${indexName}' for field '${embeddingField}.embedding'`
    );

    // Note: Atlas Search indexes take time to build, usually 1-2 minutes
    console.log(
      `Index '${indexName}' is being built. It may take 1-2 minutes to become available.`
    );
  } catch (error) {
    console.error(
      `Failed to create vector search index: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    // Don't throw - allow fallback to in-memory search
  }
}

/**
 * Perform vector search using MongoDB Atlas Search
 */
export async function performVectorSearch<T>(
  model: Model<T>,
  queryEmbedding: number[],
  fieldName: string,
  options: SemanticSearchOptions
): Promise<SearchResult<T>[]> {
  const {
    limit = 10,
    threshold = 0.7,
    filter = {},
    indexName = "vector_index",
    numCandidates = limit * 10,
  } = options;

  try {
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: indexName,
          path: `${fieldName}.embedding`,
          queryVector: queryEmbedding,
          numCandidates: Math.max(numCandidates, limit),
          limit: limit,
        },
      },
    ];

    // Add similarity score
    pipeline.push({
      $addFields: {
        similarity: { $meta: "vectorSearchScore" },
      },
    });

    // Apply threshold filter
    if (threshold > 0) {
      pipeline.push({
        $match: {
          similarity: { $gte: threshold },
        },
      });
    }

    // Apply additional filters
    if (Object.keys(filter).length > 0) {
      pipeline.push({
        $match: filter,
      });
    }

    // Sort by similarity descending
    pipeline.push({
      $sort: { similarity: -1 },
    });

    // Limit results
    pipeline.push({
      $limit: limit,
    });

    const results = await model.aggregate(pipeline).exec();

    return results.map((doc: any) => ({
      document: doc as T,
      similarity: doc.similarity || 0,
      metadata: {
        field: fieldName,
        distance: 1 - (doc.similarity || 0),
      },
    }));
  } catch (error) {
    console.error(
      `Vector search failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors (fallback for in-memory search)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
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
 * Perform in-memory similarity search (fallback when vector search unavailable)
 */
export async function performInMemorySearch<T>(
  model: Model<T>,
  queryEmbedding: number[],
  fieldName: string,
  options: SemanticSearchOptions
): Promise<SearchResult<T>[]> {
  const { limit = 10, threshold = 0.7, filter = {} } = options;

  try {
    // Build the filter query with proper types
    const searchFilter: FilterQuery<T> = {
      ...filter,
      [`${fieldName}.embedding`]: { $exists: true },
    } as FilterQuery<T>;

    // Find documents with embeddings
    const docs = await model.find(searchFilter).exec();

    const results: SearchResult<T>[] = [];

    for (const doc of docs) {
      const docEmbedding = (doc as any)[fieldName]?.embedding;
      if (!docEmbedding) continue;

      const similarity = cosineSimilarity(queryEmbedding, docEmbedding);

      if (similarity >= threshold) {
        results.push({
          document: doc as T,
          similarity,
          metadata: {
            field: fieldName,
            distance: 1 - similarity,
          },
        });
      }
    }

    // Sort by similarity and limit
    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  } catch (error) {
    console.error(
      `In-memory search failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    throw error;
  }
}

/**
 * Check if MongoDB Atlas Search is available by testing collection methods
 */
export function hasAtlasSearchSupport(model: Model<any>): boolean {
  const collection = model.collection;
  return (
    typeof (collection as any).listSearchIndexes === "function" &&
    typeof (collection as any).createSearchIndex === "function"
  );
}
