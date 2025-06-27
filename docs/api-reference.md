# API Reference

Complete reference for mongoose-ai methods and core interfaces.

## Quick Navigation

- [Plugin Setup](#plugin-setup)
- [Document Methods](#document-methods)
- [Model Methods](#model-methods)
- [Configuration](#configuration)
- [Utility Functions](#utility-functions)
- [Types Reference](types-reference.md)

## Plugin Setup

### aiPlugin()

Add AI capabilities to Mongoose schemas.

```typescript
import { aiPlugin } from "@jmndao/mongoose-ai";

schema.plugin(aiPlugin, options: AIPluginOptions);
```

**Basic Setup:**

```typescript
schema.plugin(aiPlugin, {
  ai: {
    model: "summary" | "embedding",
    provider: "openai" | "anthropic",
    field: "aiFieldName",
    credentials: { apiKey: "..." },
  },
});
```

**Advanced Setup:**

```typescript
import { createAdvancedAIConfig, QuickFunctions } from "@jmndao/mongoose-ai";

schema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai",
    model: "summary",
    field: "aiSummary",
    advanced: { enableFunctions: true },
    functions: [QuickFunctions.updateField("category")],
  }),
});
```

## Document Methods

Methods available on document instances.

### getAIContent()

Get AI-generated content for the document.

```typescript
document.getAIContent(): SummaryResult | EmbeddingResult | null
```

**Example:**

```typescript
const content = article.getAIContent();
if (content) {
  console.log(content.summary);
  console.log(content.generatedAt);
}
```

### regenerateAI()

Force regeneration of AI content.

```typescript
await document.regenerateAI(): Promise<void>
```

### calculateSimilarity()

Calculate similarity between documents (embedding models only).

```typescript
document.calculateSimilarity(other: Document): number
```

**Returns:** Number between 0-1 (1 = identical, 0 = completely different)

## Model Methods

Methods available on model constructors (embedding models only).

### semanticSearch()

Search documents using natural language.

```typescript
await Model.semanticSearch(
  query: string,
  options?: SemanticSearchOptions
): Promise<SearchResult[]>
```

**Parameters:**

- `query`: Natural language search query
- `options.limit`: Maximum results (default: 10)
- `options.threshold`: Minimum similarity (default: 0.7)
- `options.filter`: MongoDB query filters

**Example:**

```typescript
const results = await Product.semanticSearch("wireless headphones", {
  limit: 5,
  threshold: 0.8,
  filter: { category: "electronics" },
});
```

### findSimilar()

Find documents similar to a reference document.

```typescript
await Model.findSimilar(
  document: Document,
  options?: SemanticSearchOptions
): Promise<SearchResult[]>
```

**Example:**

```typescript
const similar = await Article.findSimilar(referenceArticle, {
  limit: 3,
  threshold: 0.7,
});
```

## Configuration

### createAdvancedAIConfig()

Create configuration with multi-provider and function calling support.

```typescript
createAdvancedAIConfig(options: AdvancedAIOptions): AIConfig
```

**Core Options:**

- `apiKey`: API key for chosen provider
- `provider`: "openai" | "anthropic"
- `model`: "summary" | "embedding"
- `field`: Field name for AI results

**Advanced Options:**

- `advanced.enableFunctions`: Enable function calling (default: false)
- `advanced.maxRetries`: Retry failed requests (default: 2)
- `advanced.timeout`: Request timeout in ms (default: 30000)
- `advanced.logLevel`: "debug" | "info" | "warn" | "error" (default: "warn")

**Model Config:**

- `modelConfig.chatModel`: Specific model name
- `modelConfig.maxTokens`: Response length (default: 200)
- `modelConfig.temperature`: Creativity 0-1 (default: 0.3)

### QuickFunctions

Pre-built functions for common use cases.

```typescript
// Update field with allowed values
QuickFunctions.updateField(fieldName: string, allowedValues?: string[])

// Score field within numeric range
QuickFunctions.scoreField(fieldName: string, min: number, max: number)

// Manage array fields (tags, categories)
QuickFunctions.manageTags(fieldName: string)
```

**Example:**

```typescript
functions: [
  QuickFunctions.updateField("sentiment", ["positive", "negative", "neutral"]),
  QuickFunctions.scoreField("priority", 1, 5),
  QuickFunctions.manageTags("tags"),
];
```

## Utility Functions

### validateApiKey()

Validate API key format.

```typescript
validateApiKey(apiKey: string, provider: "openai" | "anthropic"): boolean
```

### checkEnvironment()

Check if environment is properly configured.

```typescript
checkEnvironment(): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
}
```

### estimateCost()

Estimate cost for AI operations.

```typescript
estimateCost(
  tokenCount: number,
  model: string,
  provider?: "openai" | "anthropic"
): number
```

## Provider Limitations

**OpenAI:**

- Supports both summary and embedding models
- Full feature set available
- Higher costs

**Anthropic:**

- Summary models only (no embeddings)
- No semantic search capabilities
- Superior function calling and reasoning
- Lower costs

**Embedding Model Features (OpenAI only):**

- `Model.semanticSearch()`
- `Model.findSimilar()`
- `document.calculateSimilarity()`

## Core Types

### AIConfig

Main configuration interface. See [Types Reference](types-reference.md#aiconfig) for full details.

### SummaryResult

Result from summary models:

```typescript
{
  summary: string;
  generatedAt: Date;
  model: string;
  tokenCount?: number;
  functionResults?: FunctionResult[];
}
```

### EmbeddingResult

Result from embedding models:

```typescript
{
  embedding: number[];
  generatedAt: Date;
  model: string;
  dimensions: number;
}
```

### SearchResult

Semantic search result:

```typescript
{
  document: T;
  similarity: number;
  metadata?: { field: string; distance: number };
}
```

## Error Handling

All methods throw descriptive errors. Use try-catch blocks:

```typescript
try {
  await document.regenerateAI();
} catch (error) {
  console.error("AI processing failed:", error.message);
}
```

Set `advanced.continueOnError: true` to save documents even if AI processing fails.

## Next Steps

- [Types Reference](types-reference.md) - Complete TypeScript definitions
- [Function Calling](function-calling.md) - Auto-classification guide
- [Configuration](configuration.md) - All configuration options
- [Examples](examples/) - Working code examples
