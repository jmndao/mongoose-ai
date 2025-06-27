# Get Started

Quick guide to set up mongoose-ai in your project.

## Install

```bash
npm install @jmndao/mongoose-ai
```

## Setup Environment

Create a `.env` file:

```bash
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
MONGODB_URI=mongodb://localhost:27017/your_database
```

You need at least one API key.

## Provider Capabilities

Before choosing a provider, understand what each offers:

| Feature            | OpenAI | Anthropic      |
| ------------------ | ------ | -------------- |
| Text Summarization | Yes    | Yes            |
| Function Calling   | Yes    | Yes (Superior) |
| Embeddings         | Yes    | No             |
| Semantic Search    | Yes    | No             |
| Price              | Higher | Lower          |

### Choose OpenAI if you need:

- Semantic search capabilities
- Document similarity calculations
- One provider for everything

### Choose Anthropic if you need:

- Superior reasoning and function calling
- Lower costs for text generation
- More nuanced content analysis

### Choose Both (Recommended) if you need:

- Best semantic search (OpenAI embeddings)
- Best content analysis (Anthropic reasoning)
- Maximum capabilities

## Basic Usage

### Auto-Summary

```typescript
import mongoose from "mongoose";
import { aiPlugin } from "@jmndao/mongoose-ai";

const articleSchema = new mongoose.Schema({
  title: String,
  content: String,
});

// Add AI plugin
articleSchema.plugin(aiPlugin, {
  ai: {
    model: "summary",
    provider: "openai", // or "anthropic"
    field: "aiSummary",
    credentials: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  },
});

const Article = mongoose.model("Article", articleSchema);

// Use it
const article = new Article({
  title: "AI in 2024",
  content: "Artificial intelligence is advancing rapidly...",
});

await article.save();
console.log(article.aiSummary.summary); // AI summary appears here
```

### Search Documents (OpenAI Only)

**Important**: Semantic search requires embeddings, which are **only available with OpenAI**. Anthropic (Claude) does not provide embedding models.

```typescript
// For semantic search, you MUST use OpenAI
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
});

productSchema.plugin(aiPlugin, {
  ai: {
    model: "embedding", // Enables semantic search
    provider: "openai", // Required - Anthropic doesn't support embeddings
    field: "searchEmbedding",
    credentials: {
      apiKey: process.env.OPENAI_API_KEY, // Must be OpenAI key
    },
  },
});

const Product = mongoose.model("Product", productSchema);

// These methods are now available:
const results = await Product.semanticSearch("wireless headphones", {
  limit: 5,
});

const similar = await Product.findSimilar(existingProduct, {
  limit: 3,
});

const similarity = product1.calculateSimilarity(product2);
console.log(`Products are ${(similarity * 100).toFixed(1)}% similar`);
```
