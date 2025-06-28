/**
 * Search and similarity types
 */

/**
 * Semantic search result
 */
export interface SearchResult<T = any> {
    document: T;
    similarity: number;
    metadata?: {
      field: string;
      distance: number;
    };
  }
  
  /**
   * Semantic search options
   */
  export interface SemanticSearchOptions {
    /** Maximum number of results (default: 10) */
    limit?: number;
    /** Minimum similarity threshold (default: 0.7) */
    threshold?: number;
    /** Include similarity scores (default: true) */
    includeScore?: boolean;
    /** Additional MongoDB query filters */
    filter?: Record<string, any>;
    /** Use MongoDB Vector Search instead of in-memory search (default: auto-detect) */
    useVectorSearch?: boolean;
    /** Vector search index name (default: 'vector_index') */
    indexName?: string;
    /** Number of candidates for vector search (default: limit * 10) */
    numCandidates?: number;
  }
  
  /**
   * Type guard for semantic search results
   */
  export function isSearchResult<T>(obj: any): obj is SearchResult<T> {
    return (
      obj &&
      typeof obj.similarity === "number" &&
      obj.document &&
      typeof obj.metadata === "object"
    );
  }