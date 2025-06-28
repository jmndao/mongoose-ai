# Get Started

Quick guide to set up mongoose-ai in your project.

## Install

```bash
npm install @jmndao/mongoose-ai
```

## Choose Your Provider

mongoose-ai supports three providers with different benefits:

### Cloud Providers (OpenAI/Anthropic)

- **Setup**: API key required
- **Cost**: Pay per request
- **Performance**: Excellent
- **Privacy**: Data sent to external services

### Local Provider (Ollama)

- **Setup**: Local installation required
- **Cost**: $0.00 (free)
- **Performance**: Hardware dependent
- **Privacy**: 100% local processing

## Setup Environment

### Option 1: Cloud Providers

Create a `.env` file:

```bash
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
MONGODB_URI=mongodb://localhost:27017/your_database
```

You need at least one API key.

### Option 2: Local LLM (Ollama)

Install and setup Ollama:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Download models
ollama pull llama3.2          # For summaries
ollama pull nomic-embed-text  # For embeddings

# Start Ollama
ollama serve
```

No API keys or `.env` setup needed for Ollama!

## Provider Capabilities

| Feature            | OpenAI          | Anthropic       | Ollama     |
| ------------------ | --------------- | --------------- | ---------- |
| Text Summarization | Yes             | Yes             | Yes        |
| Function Calling   | Yes             | Yes (Superior)  | Yes        |
| Embeddings         | Yes             | No              | Yes        |
| Semantic Search    | Yes             | No              | Yes        |
| Cost               | $1.50/1M tokens | $0.25/1M tokens | $0.00      |
| Privacy            | External        | External        | 100% Local |
| Offline            | No              | No              | Yes        |

### Choose OpenAI if you need:

- Best overall quality and performance
- Reliable semantic search capabilities
- One provider for everything

### Choose Anthropic if you need:

- Superior reasoning and function calling
- Lower costs for text generation
- More nuanced content analysis

### Choose Ollama if you need:

- Zero costs for unlimited processing
- Complete data privacy and compliance
- Offline capability
- Learning AI without ongoing expenses

### Choose Multiple Providers if you need:

- Different providers for different use cases
- Cost optimization strategies
- Maximum capabilities across all features

## Basic Usage

### Auto-Summary (Any Provider)

```typescript
import mongoose from "mongoose";
import { aiPlugin, createOllamaConfig } from "@jmndao/mongoose-ai";

const articleSchema = new mongoose.Schema({
  title: String,
  content: String,
});

// Option 1: Cloud provider
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

// Option 2: Local provider (no API key needed)
articleSchema.plugin(aiPlugin, {
  ai: createOllamaConfig({
    model: "summary",
    field: "aiSummary",
    chatModel: "llama3.2",
  }),
});

const Article = mongoose.model("Article", articleSchema);

// Use it (same API regardless of provider)
const article = new Article({
  title: "AI in 2024",
  content: "Artificial intelligence is advancing rapidly...",
});

await article.save();
console.log(article.aiSummary.summary); // AI summary appears here
```

### Semantic Search (OpenAI or Ollama)

**Important**: Semantic search requires embeddings, which are available with **OpenAI and Ollama**. Anthropic (Claude) does not provide embedding models.

```typescript
import {
  createAdvancedAIConfig,
  createOllamaConfig,
} from "@jmndao/mongoose-ai";

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
});

// Option 1: OpenAI embeddings
productSchema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai",
    model: "embedding", // Enables semantic search
    field: "searchEmbedding",
  }),
});

// Option 2: Local embeddings (free)
productSchema.plugin(aiPlugin, {
  ai: createOllamaConfig({
    model: "embedding", // Enables semantic search
    field: "searchEmbedding",
    embeddingModel: "nomic-embed-text",
  }),
});

const Product = mongoose.model("Product", productSchema);

// These methods are now available (same API for both providers):
const results = await Product.semanticSearch("wireless headphones", {
  limit: 5,
});

const similar = await Product.findSimilar(existingProduct, {
  limit: 3,
});

const similarity = product1.calculateSimilarity(product2);
console.log(`Products are ${(similarity * 100).toFixed(1)}% similar`);
```

### Function Calling (Any Provider)

```typescript
import {
  createAdvancedAIConfig,
  createOllamaConfig,
  QuickFunctions,
} from "@jmndao/mongoose-ai";

const reviewSchema = new mongoose.Schema({
  productName: String,
  reviewText: String,
  sentiment: String, // AI will fill this
  rating: Number, // AI will fill this
  tags: [String], // AI will fill this
});

// Cloud provider with function calling
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

// Local provider with function calling (free)
reviewSchema.plugin(aiPlugin, {
  ai: createOllamaConfig({
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

const Review = mongoose.model("Review", reviewSchema);

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

## Hybrid Setup (Multiple Providers)

Use different providers for different purposes:

```typescript
// Use Ollama for development (free)
const devSchema = new mongoose.Schema({
  title: String,
  content: String,
});

devSchema.plugin(aiPlugin, {
  ai: createOllamaConfig({
    model: "summary",
    field: "aiSummary",
  }),
});

// Use OpenAI for production embeddings
const prodSchema = new mongoose.Schema({
  title: String,
  content: String,
});

prodSchema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai",
    model: "embedding",
    field: "searchEmbedding",
  }),
});
```

## Common Patterns

### Environment-Based Configuration

```typescript
const getAIConfig = () => {
  if (process.env.NODE_ENV === "development") {
    // Use free local processing for development
    return createOllamaConfig({
      model: "summary",
      field: "aiSummary",
    });
  }

  // Use cloud providers for production
  return createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai",
    model: "summary",
    field: "aiSummary",
  });
};

schema.plugin(aiPlugin, { ai: getAIConfig() });
```

### Cost-Optimized Setup

```typescript
// Free processing for internal documents
const internalConfig = createOllamaConfig({
  model: "summary",
  field: "aiSummary",
});

// Premium processing for customer-facing content
const customerConfig = createAdvancedAIConfig({
  apiKey: process.env.OPENAI_API_KEY,
  provider: "openai",
  model: "summary",
  field: "aiSummary",
  modelConfig: { chatModel: "gpt-4" },
});

// Apply based on document type
schema.pre("save", function () {
  if (this.isCustomerFacing) {
    // Use premium provider
  } else {
    // Use free provider
  }
});
```

## Troubleshooting

### OpenAI/Anthropic Issues

- Verify API key format: OpenAI keys start with `sk-`, Anthropic with `sk-ant-`
- Check API quotas and billing
- Ensure network connectivity

### Ollama Issues

- Verify Ollama is running: `ollama serve`
- Check models are downloaded: `ollama list`
- Test connection: `curl http://localhost:11434/api/tags`

### MongoDB Issues

- Ensure MongoDB is running and accessible
- Check connection string format
- Verify network connectivity to MongoDB Atlas (if using)

## Next Steps

- **[Configuration](configuration.md)** - Detailed configuration options
- **[Function Calling](function-calling.md)** - Advanced auto-classification
- **[Performance](performance.md)** - Optimization strategies
- **[Examples](examples/)** - Real-world usage examples

## Quick Commands

```bash
# Run examples
npm run example:basic           # Basic usage
npm run example:functions       # Function calling
npm run example:vector-search   # Semantic search
npm run example:ollama          # Local LLM processing

# Ollama commands
ollama pull llama3.2           # Download chat model
ollama pull nomic-embed-text   # Download embedding model
ollama list                    # List downloaded models
ollama serve                   # Start Ollama server
```
