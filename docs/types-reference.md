# Types Reference

TypeScript definitions for mongoose-ai.

## Core Types

```typescript
type AIModel = "summary" | "embedding";
type AIProvider = "openai" | "anthropic";
type LogLevel = "debug" | "info" | "warn" | "error";
```

## Configuration

### AIConfig

Main configuration interface:

```typescript
interface AIConfig {
  model: AIModel;
  provider: AIProvider;
  field: string;
  credentials: AICredentials;
  prompt?: string;
  advanced?: AIAdvancedOptions;
  modelConfig?: OpenAIModelConfig | AnthropicModelConfig;
  includeFields?: string[];
  excludeFields?: string[];
  functions?: AIFunction[];
}
```

### AICredentials

```typescript
interface AICredentials {
  apiKey: string;
  organizationId?: string; // OpenAI only
}
```

### AIAdvancedOptions

```typescript
interface AIAdvancedOptions {
  maxRetries?: number; // Default: 2
  timeout?: number; // Default: 30000
  skipOnUpdate?: boolean; // Default: false
  forceRegenerate?: boolean; // Default: false
  logLevel?: LogLevel; // Default: "warn"
  continueOnError?: boolean; // Default: true
  enableFunctions?: boolean; // Default: false
}
```

## Model Configuration

### OpenAIModelConfig

```typescript
interface OpenAIModelConfig {
  chatModel?: string; // Default: "gpt-3.5-turbo"
  embeddingModel?: string; // Default: "text-embedding-3-small"
  maxTokens?: number; // Default: 200
  temperature?: number; // Default: 0.3
}
```

### AnthropicModelConfig

```typescript
interface AnthropicModelConfig {
  chatModel?: string; // Default: "claude-3-haiku-20240307"
  maxTokens?: number; // Default: 200
  temperature?: number; // Default: 0.3
}
```

## Function Calling

### AIFunction

```typescript
interface AIFunction {
  name: string;
  description: string;
  parameters: Record<string, FunctionParameter>;
  handler: (args: any, document: Document) => Promise<void> | void;
}
```

### FunctionParameter

```typescript
interface FunctionParameter {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[] | number[];
  items?: FunctionParameter;
  properties?: Record<string, FunctionParameter>;
  required?: boolean;
}
```

### FunctionResult

```typescript
interface FunctionResult {
  name: string;
  success: boolean;
  result?: any;
  error?: string;
  executedAt: Date;
}
```

## Results

### SummaryResult

```typescript
interface SummaryResult {
  summary: string;
  generatedAt: Date;
  model: string;
  tokenCount?: number;
  processingTime?: number;
  functionResults?: FunctionResult[];
}
```

### EmbeddingResult

```typescript
interface EmbeddingResult {
  embedding: number[];
  generatedAt: Date;
  model: string;
  dimensions: number;
  processingTime?: number;
  functionResults?: FunctionResult[];
}
```

## Search

### SearchResult

```typescript
interface SearchResult<T = any> {
  document: T;
  similarity: number;
  metadata?: {
    field: string;
    distance: number;
  };
}
```

### SemanticSearchOptions

```typescript
interface SemanticSearchOptions {
  limit?: number; // Default: 10
  threshold?: number; // Default: 0.7
  includeScore?: boolean; // Default: true
  filter?: Record<string, any>; // MongoDB filters
}
```

## Enhanced Types

### AIDocument

Document with AI methods:

```typescript
type AIDocument<T = any> = Document &
  T & {
    getAIContent(): SummaryResult | EmbeddingResult | null;
    regenerateAI(): Promise<void>;
    calculateSimilarity?(other: any): number;
  };
```

### AIModelType

Model with AI static methods:

```typescript
type AIModelType<T = any> = Model<T> & {
  semanticSearch(
    query: string,
    options?: SemanticSearchOptions
  ): Promise<SearchResult<T>[]>;
  findSimilar(
    document: T,
    options?: SemanticSearchOptions
  ): Promise<SearchResult<T>[]>;
};
```

## Type Helpers

### WithAI

Add AI methods to existing model:

```typescript
type WithAI<TModel extends Model<any>> = TModel & {
  semanticSearch(
    query: string,
    options?: SemanticSearchOptions
  ): Promise<SearchResult<any>[]>;
  findSimilar(
    document: any,
    options?: SemanticSearchOptions
  ): Promise<SearchResult<any>[]>;
};
```

### WithAIDocument

Add AI methods to existing document:

```typescript
type WithAIDocument<TDoc extends Document> = TDoc & {
  getAIContent(): SummaryResult | EmbeddingResult | null;
  regenerateAI(): Promise<void>;
  calculateSimilarity?(other: any): number;
};
```

## Type Guards

### hasAIMethods()

```typescript
function hasAIMethods<T>(
  model: Model<T>
): model is Model<T> & AIModelStatics<T>;
```

### hasAIDocumentMethods()

```typescript
function hasAIDocumentMethods<T extends Document>(
  doc: T
): doc is T & AIDocumentMethods;
```

### isSearchResult()

```typescript
function isSearchResult<T>(obj: any): obj is SearchResult<T>;
```

## Usage Example

```typescript
import mongoose from "mongoose";
import {
  aiPlugin,
  AIDocument,
  AIModelType,
  SummaryResult,
} from "@jmndao/mongoose-ai";

interface IArticle {
  title: string;
  content: string;
}

const articleSchema = new mongoose.Schema<IArticle>({
  title: String,
  content: String,
});

articleSchema.plugin(aiPlugin, {
  /* config */
});

// Typed model with AI capabilities
const Article = mongoose.model<AIDocument<IArticle>>(
  "Article",
  articleSchema
) as AIModelType<IArticle>;

// Type-safe usage
const article = new Article({ title: "...", content: "..." });
const aiContent: SummaryResult | null = article.getAIContent();
const results = await Article.semanticSearch("query");
```
