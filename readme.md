# mongoose-ai

**Add AI powers to your Mongoose schemas**

[![npm version](https://img.shields.io/npm/v/@jmndao/mongoose-ai.svg)](https://www.npmjs.com/package/@jmndao/mongoose-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Automatically generate summaries, classify content, and search documents using AI. Works with OpenAI and Anthropic.

## What's New in v1.3.3

- **Function Calling** - AI automatically fills fields (sentiment, priority, tags)
- **Multi-Provider** - Use OpenAI or Anthropic Claude
- **100% Compatible** - All v1.0.x code still works

## Features

- Auto-generate summaries when documents are saved
- AI classifies and tags content automatically
- Search documents using natural language
- Works with OpenAI GPT and Anthropic Claude
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
console.log(article.aiSummary.summary); // AI-generated summary
```

### Function Calling (Auto-Classification)

```typescript
import {
  aiPlugin,
  createAdvancedAIConfig,
  QuickFunctions,
} from "@jmndao/mongoose-ai";

const reviewSchema = new mongoose.Schema({
  productName: String,
  reviewText: String,
  // AI fills these automatically
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
    advanced: {
      enableFunctions: true,
    },
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
const review = new Review({
  productName: "Wireless Headphones",
  reviewText: "Great sound quality! Love the battery life.",
});

await review.save();
console.log(review.sentiment); // "positive"
console.log(review.rating); // 4
console.log(review.tags); // ["sound-quality", "battery-life"]
```

## Documentation

### Core Guides

- **[Get Started](docs/get-started.md)** - Setup and first steps
- **[Function Calling](docs/function-calling.md)** - Auto-classification
- **[Configuration](docs/configuration.md)** - All options
- **[Migration](docs/migration.md)** - Upgrade from v1.0.x

### Reference

- **[API Reference](docs/api-reference.md)** - Methods and types
- **[Types Reference](docs/types-reference.md)** - Type definitions
- **[Performance](docs/performance.md)** - Speed and costs

### Advanced

- **[Usage Examples](docs/examples/usage-examples.md)** - Real-world examples
- **[Scaling Guide](docs/guides/scaling-guide.md)** - Large projects
- **[Docker Setup](docs/guides/docker-setup.md)** - Development setup
- **[Benchmark Results](docs/annexes/benchmark-results.md)** - Performance data

## Setup

Create a `.env` file:

```bash
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
MONGODB_URI=mongodb://localhost:27017/your_database
```

## Requirements

- Node.js 16+
- Mongoose 7+
- OpenAI or Anthropic API key

## Performance

- **Basic**: ~$0.42 per 1000 documents, 1.6 seconds each
- **Function Calling**: ~$1.39 per 1000 documents, 2.1 seconds each

Function calling costs more but saves manual work.

## Examples

Check the `examples/` folder:

- `basic-usage.ts` - Simple examples
- `function-calling-usage.ts` - Auto-classification
- `advanced-usage.ts` - Complex setups
- `benchmark-demo.ts` - Performance tests

## Support

- **Issues**: [GitHub Issues](https://github.com/jmndao/mongoose-ai/issues)
- **Docs**: [Full Documentation](docs/)

## License

MIT © [Jonathan Moussa NDAO](https://github.com/jmndao)

---

**Built for MongoDB and AI developers**
