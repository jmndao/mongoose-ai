# mongoose-ai

**AI-powered Mongoose plugin for intelligent document processing**

[![npm version](https://img.shields.io/npm/v/@jmndao/mongoose-ai.svg)](https://www.npmjs.com/package/@jmndao/mongoose-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Transform your MongoDB documents with AI-powered summarization and semantic search capabilities. Built for production use with full TypeScript support.

## Features

- **Auto-Summarization** - Generate intelligent summaries on document save
- **Semantic Search** - Natural language search with vector embeddings
- **High Performance** - Optimized for production with built-in error handling
- **Type Safe** - Full TypeScript support with comprehensive type definitions
- **Configurable** - Advanced options for retries, field filtering, and custom prompts
- **Cost Tracking** - Monitor token usage and estimate API costs
- **Production Ready** - Robust error handling and graceful degradation

## Quick Start

### Installation

```bash
npm install @jmndao/mongoose-ai
```

### Basic Usage

```typescript
import mongoose from "mongoose";
import { aiPlugin } from "@jmndao/mongoose-ai";

// Define your schema
const articleSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
});

// Add AI summarization
articleSchema.plugin(aiPlugin, {
  ai: {
    model: "summary",
    provider: "openai",
    field: "aiSummary",
    credentials: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  },
});

const Article = mongoose.model("Article", articleSchema);

// Create article - summary generated automatically
const article = new Article({
  title: "Getting Started with AI",
  content:
    "Artificial intelligence is transforming how we build applications...",
  author: "Jane Smith",
});

await article.save();
console.log(article.aiSummary.summary); // AI-generated summary
```

### Semantic Search

```typescript
// Enable semantic search for products
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
});

productSchema.plugin(aiPlugin, {
  ai: {
    model: "embedding",
    provider: "openai",
    field: "searchEmbedding",
    credentials: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  },
});

const Product = mongoose.model("Product", productSchema);

// Search using natural language
const results = await Product.semanticSearch("wireless headphones", {
  limit: 5,
  threshold: 0.7,
});

console.log(results); // Products ranked by semantic similarity
```

## Configuration

### Basic Configuration

```typescript
schema.plugin(aiPlugin, {
  ai: {
    model: 'summary' | 'embedding',
    provider: 'openai',
    field: string,
    credentials: {
      apiKey: string,
      organizationId?: string,
    },
    prompt?: string,
    includeFields?: string[],   // Fields to include in processing
    excludeFields?: string[],   // Fields to exclude from processing
  },
});
```

### Advanced Configuration

```typescript
import { createAIConfig } from "@jmndao/mongoose-ai";

schema.plugin(aiPlugin, {
  ai: createAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    model: "summary",
    field: "aiSummary",
    prompt: "Create a professional summary:",
    advanced: {
      maxRetries: 3,
      timeout: 45000,
      skipOnUpdate: true,
      logLevel: "info",
    },
    modelConfig: {
      chatModel: "gpt-4",
      maxTokens: 150,
      temperature: 0.2,
    },
  }),
});
```

## API Reference

### Instance Methods

```typescript
// Get AI-generated content
const content = document.getAIContent();

// Regenerate AI content
await document.regenerateAI();

// Calculate similarity (embedding models only)
const similarity = document1.calculateSimilarity(document2);
```

### Static Methods

```typescript
// Semantic search
const results = await Model.semanticSearch("search query", {
  limit: 10,
  threshold: 0.7,
  filter: { category: "technology" },
});

// Find similar documents
const similar = await Model.findSimilar(referenceDocument, {
  limit: 5,
  threshold: 0.8,
});
```

### Utility Functions

```typescript
import {
  validateApiKey,
  estimateCost,
  estimateTokenCount,
  checkEnvironment,
} from "@jmndao/mongoose-ai";

// Validate API key format
const isValid = validateApiKey("sk-...");

// Estimate processing costs
const tokens = estimateTokenCount("Your content here");
const cost = estimateCost(tokens, "gpt-3.5-turbo");

// Check environment setup
const envCheck = checkEnvironment();
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import {
  AIDocument,
  AIModelType,
  WithAI,
  hasAIMethods,
} from "@jmndao/mongoose-ai";

interface IArticle {
  title: string;
  content: string;
  author: string;
}

const Article = mongoose.model<AIDocument<IArticle>>(
  "Article",
  articleSchema
) as AIModelType<IArticle>;

// Type-safe checking
if (hasAIMethods(Article)) {
  const results = await Article.semanticSearch("query");
}
```

## Environment Setup

Create a `.env` file:

```bash
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017/your_database
```

Verify your setup:

```typescript
import { checkEnvironment } from "@jmndao/mongoose-ai";

const envCheck = checkEnvironment();
if (!envCheck.isValid) {
  console.error("Missing:", envCheck.missing);
  process.exit(1);
}
```

## Performance

mongoose-ai is designed to scale with your application:

- **Small Projects** (< 1K documents): Works perfectly out of the box
- **Medium Projects** (1K-10K documents): Excellent performance with default settings
- **Large Projects** (10K-100K documents): May require optimization strategies
- **Enterprise** (100K+ documents): Consider vector database integration

**Benchmarks:**

- Processing time: ~1.6 seconds per document
- Throughput: 38+ documents per minute
- Cost: ~$0.0003 per document
- 99.7% faster than manual processing

## Error Handling

The plugin includes robust error handling:

```typescript
schema.plugin(aiPlugin, {
  ai: {
    // ... other config
    advanced: {
      continueOnError: true, // Save document even if AI fails
      maxRetries: 3, // Retry failed requests
      timeout: 30000, // 30 second timeout
      logLevel: "warn", // Log warnings and errors
    },
  },
});
```

## Documentation

- **[Usage Examples](docs/usage-examples.md)** - Comprehensive examples and patterns
- **[Scaling Guide](docs/scaling-guide.md)** - Performance optimization and scaling strategies
- **[Docker Setup](docs/docker-setup.md)** - Development environment setup
- **[Benchmark Results](docs/benchmark-results.md)** - Performance analysis and metrics
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project
- **[Changelog](CHANGELOG.md)** - Release notes and version history

## Examples

The `examples/` directory contains practical implementations:

- **[basic-usage.ts](examples/basic-usage.ts)** - Simple getting started examples
- **[usage.ts](examples/usage.ts)** - Advanced usage patterns and configurations
- **[benchmark-demo.ts](examples/benchmark-demo.ts)** - Performance testing and benchmarking
- **[scaling-test.ts](examples/scaling-test.ts)** - Database scaling tests and analysis

## Requirements

- **Node.js** 16.0.0 or higher
- **Mongoose** 7.0.0 or higher
- **OpenAI API Key** for AI processing
- **TypeScript** 5.0+ (for TypeScript projects)

## Common Use Cases

- **Content Management** - Auto-generate summaries for blog posts and articles
- **E-commerce** - Enable semantic search for product catalogs
- **Documentation** - Create searchable knowledge bases
- **User Profiles** - Generate profile summaries and skills matching
- **News Aggregation** - Summarize and categorize news articles
- **Research** - Process and search academic papers and documents

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Setting up the development environment
- Running tests and quality checks
- Submitting pull requests
- Reporting bugs and requesting features

## Support

- **Issues**: [GitHub Issues](https://github.com/jmndao/mongoose-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jmndao/mongoose-ai/discussions)
- **Documentation**: [Full Documentation](docs/)

## License

MIT © [Jonathan Moussa NDAO](https://github.com/jmndao)

## Links

- **[NPM Package](https://www.npmjs.com/package/@jmndao/mongoose-ai)**
- **[GitHub Repository](https://github.com/jmndao/mongoose-ai)**
- **[Issues](https://github.com/jmndao/mongoose-ai/issues)**
- **[Examples](examples/)**

---

**Built with ❤️ for the MongoDB and AI community**
