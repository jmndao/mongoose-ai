# mongoose-ai

**AI-powered Mongoose plugin for intelligent document processing**

[![npm version](https://img.shields.io/npm/v/@jmndao/mongoose-ai.svg)](https://www.npmjs.com/package/@jmndao/mongoose-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Automatically generate summaries, classify content, and search documents using AI. Works with OpenAI, Anthropic, and local LLMs via Ollama. Includes MongoDB Atlas Vector Search support for production-scale semantic search.

## Features

- Auto-generate summaries when documents are saved
- AI classifies and tags content automatically
- High-performance semantic search with MongoDB Vector Search
- Privacy-first local AI processing with Ollama
- Search documents using natural language
- Works with OpenAI GPT, Anthropic Claude, and local LLMs
- Full TypeScript support
- Built for production use

## Quick Start

### Install

```bash
npm install @jmndao/mongoose-ai
```

### Basic Usage

```typescript
import mongoose from "mongoose";
import { aiPlugin } from "@jmndao/mongoose-ai";

const articleSchema = new mongoose.Schema({
  title: String,
  content: String,
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

// AI summary is generated automatically
const article = new Article({
  title: "Getting Started with AI",
  content: "Artificial intelligence is changing everything...",
});

await article.save();
console.log(article.aiSummary.summary);
```

### Local AI with Ollama

```typescript
import { createOllamaConfig } from "@jmndao/mongoose-ai";

// Zero cost, privacy-first AI processing
articleSchema.plugin(aiPlugin, {
  ai: createOllamaConfig({
    model: "summary",
    field: "aiSummary",
    chatModel: "llama3.2",
  }),
});

// Setup: ollama pull llama3.2
```

### Semantic Search

```typescript
import { createAdvancedAIConfig } from "@jmndao/mongoose-ai";

articleSchema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai",
    model: "embedding",
    field: "aiEmbedding",
  }),
});

// Search documents using natural language
const results = await Article.semanticSearch(
  "artificial intelligence and neural networks",
  { limit: 5, threshold: 0.7 }
);
```

### Function Calling

```typescript
import { QuickFunctions } from "@jmndao/mongoose-ai";

const reviewSchema = new mongoose.Schema({
  productName: String,
  reviewText: String,
  sentiment: String,
  rating: Number,
  tags: [String],
});

reviewSchema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai",
    model: "summary",
    field: "aiSummary",
    advanced: { enableFunctions: true },
    functions: [
      QuickFunctions.updateField("sentiment", [
        "positive",
        "negative",
        "neutral",
      ]),
      QuickFunctions.scoreField("rating", 1, 5),
      QuickFunctions.manageTags("tags"),
    ],
  }),
});

// AI automatically fills sentiment, rating, and tags
```

## Provider Comparison

| Feature     | OpenAI          | Anthropic       | Ollama             |
| ----------- | --------------- | --------------- | ------------------ |
| Cost        | $1.50/1M tokens | $0.25/1M tokens | $0.00              |
| Privacy     | External API    | External API    | 100% Local         |
| Setup       | API key         | API key         | Local install      |
| Offline     | No              | No              | Yes                |
| Performance | Excellent       | Excellent       | Hardware dependent |

## Performance

### Processing Speed

- Basic summarization: ~1.6 seconds per document
- Function calling: ~2.1 seconds per document
- Local processing: 2-10 seconds per document (hardware dependent)

### Search Performance

- MongoDB Atlas Vector Search: Sub-100ms on millions of documents
- In-memory search: Good for development and small datasets
- Automatic optimization based on deployment

### Cost Analysis

- Cloud providers: $0.42-$1.39 per 1000 documents
- Local processing: $0.00 per document
- Vector search: 10-3000x faster than traditional search

## Documentation

### Core Guides

- **[Get Started](docs/get-started.md)** - Setup and first steps
- **[Configuration](docs/configuration.md)** - All providers and options
- **[Function Calling](docs/function-calling.md)** - Auto-classification
- **[Migration](docs/migration.md)** - Upgrade guides

### Reference

- **[API Reference](docs/api-reference.md)** - Methods and types
- **[Types Reference](docs/types-reference.md)** - TypeScript definitions
- **[Performance](docs/performance.md)** - Optimization strategies

### Advanced

- **[Usage Examples](docs/examples/usage-examples.md)** - Real-world examples
- **[Scaling Guide](docs/guides/scaling-guide.md)** - Large deployments
- **[Docker Setup](docs/guides/docker-setup.md)** - Development setup

## Requirements

- Node.js 16+
- Mongoose 7+
- API key (OpenAI/Anthropic) or Ollama installation

## Examples

Run example demonstrations:

```bash
npm run example:basic           # Basic usage
npm run example:functions       # Function calling
npm run example:vector-search   # Semantic search
npm run example:ollama          # Local LLM processing
npm run example:benchmark       # Performance testing
```

## Migration

### From v1.3.x to v1.4.0

- Local LLM support is additive with zero breaking changes
- All existing code continues to work unchanged
- Add Ollama support optionally

- Vector search is automatic and backward compatible
- No configuration changes required
- Performance improvements on MongoDB Atlas

## License

MIT © [Jonathan Moussa NDAO](https://github.com/jmndao)

---

**For detailed documentation, configuration options, and advanced usage, see the [docs](docs/) directory.**
