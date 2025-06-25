# mongoose-ai

🤖 **AI-powered Mongoose plugin for intelligent document processing**

[![npm version](https://img.shields.io/npm/v/mongoose-ai.svg)](https://www.npmjs.com/package/mongoose-ai)

Transform your MongoDB documents with AI-powered summarization and semantic search capabilities. Built for production use with TypeScript support.

## ✨ Features

- 🤖 **Auto-Summarization** - Generate intelligent summaries on document save
- 🔍 **Semantic Search** - Natural language search with vector embeddings
- ⚡ **High Performance** - Optimized for production with built-in caching
- 🛡️ **Type Safe** - Full TypeScript support with comprehensive types
- 🔧 **Configurable** - Advanced options for retries, field filtering, and more
- 💰 **Cost Tracking** - Monitor token usage and estimate API costs
- 🎯 **Production Ready** - Robust error handling and logging

## 🚀 Quick Start

### Installation

```bash
npm install mongoose-ai
```

### Basic Setup

```typescript
import mongoose from "mongoose";
import { aiPlugin } from "mongoose-ai";

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
// Add embedding generation for search
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

## 📖 API Reference

### Plugin Configuration

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
    advanced?: {
      maxRetries?: number,      // Default: 2
      timeout?: number,         // Default: 30000ms
      skipOnUpdate?: boolean,   // Default: false
      logLevel?: 'debug' | 'info' | 'warn' | 'error',
      continueOnError?: boolean, // Default: true
    },
    modelConfig?: {
      chatModel?: string,       // Default: 'gpt-3.5-turbo'
      embeddingModel?: string,  // Default: 'text-embedding-3-small'
      maxTokens?: number,       // Default: 200
      temperature?: number,     // Default: 0.3
    },
    includeFields?: string[],   // Fields to include in processing
    excludeFields?: string[],   // Fields to exclude from processing
  },
});
```

### Helper Functions

```typescript
import { createAIConfig, validateApiKey, estimateCost } from "mongoose-ai";

// Create configuration with defaults
const config = createAIConfig({
  apiKey: process.env.OPENAI_API_KEY,
  model: "summary",
  field: "aiSummary",
  prompt: "Summarize this content professionally:",
});

// Validate API key format
const isValid = validateApiKey("sk-...");

// Estimate processing costs
const cost = estimateCost(1000, "gpt-3.5-turbo");
```

### Instance Methods

```typescript
// Get AI-generated content
const content = document.getAIContent();

// Regenerate AI content
await document.regenerateAI();

// Calculate similarity (embedding models only)
const similarity = document1.calculateSimilarity(document2);
```

### Static Methods (Embedding Models)

```typescript
// Semantic search
const results = await Model.semanticSearch("search query", {
  limit: 10,
  threshold: 0.7,
  filter: { category: "technology" }, // Additional filters
});

// Find similar documents
const similar = await Model.findSimilar(referenceDocument, {
  limit: 5,
  threshold: 0.8,
});
```

## 🔧 Advanced Usage

### Multiple AI Fields

```typescript
import { createAIConfig } from "mongoose-ai";

const blogSchema = new mongoose.Schema({
  title: String,
  content: String,
  tags: [String],
});

// Add summary
blogSchema.plugin(aiPlugin, {
  ai: createAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    model: "summary",
    field: "summary",
    prompt: "Create an engaging summary for this blog post:",
    includeFields: ["title", "content"],
  }),
});

// Add embeddings on a cloned schema
const blogEmbeddingSchema = blogSchema.clone();
blogEmbeddingSchema.plugin(aiPlugin, {
  ai: createAIConfig({ 
    apiKey: process.env.OPENAI_API_KEY,
    model: "embedding",
    field: "contentEmbedding",
    includeFields: ["title", "content", "tags"],
  }),
});

const BlogPost = mongoose.model("BlogPost", blogEmbeddingSchema);
```

### Advanced Configuration

```typescript
blogSchema.plugin(aiPlugin, {
  ai: createAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    model: "summary",
    field: "summary",

    // Custom processing
    prompt: "Create a professional summary highlighting key insights:",
    includeFields: ["title", "content", "category"],
    excludeFields: ["author", "createdAt"],

    // Performance tuning
    advanced: {
      maxRetries: 3,
      timeout: 45000,
      skipOnUpdate: true,
      logLevel: "info",
    },

    // Model configuration
    modelConfig: {
      chatModel: "gpt-4",
      maxTokens: 150,
      temperature: 0.2,
    },
  }),
});
```

### Performance Monitoring

```typescript
import { estimateTokenCount, estimateCost } from "mongoose-ai";

// Monitor usage and costs
const documents = await BlogPost.find();
const totalTokens = documents.reduce(
  (sum, doc) => sum + (doc.summary?.tokenCount || 0),
  0
);

console.log(`Total tokens used: ${totalTokens}`);
console.log(
  `Estimated cost: $${estimateCost(totalTokens, "gpt-3.5-turbo").toFixed(4)}`
);
```

## 🔍 Generated Field Structures

### Summary Fields

```typescript
{
  summary: string;
  generatedAt: Date;
  model: string;
  tokenCount?: number;
  processingTime?: number;
}
```

### Embedding Fields

```typescript
{
  embedding: number[];
  generatedAt: Date;
  model: string;
  dimensions: number;
  processingTime?: number;
}
```

## 🎯 TypeScript Support

Full TypeScript support with proper type definitions:

```typescript
import { AIDocument, AIModelType } from "mongoose-ai";

interface IBlogPost {
  title: string;
  content: string;
  summary?: SummaryResult;
}

const BlogPost = mongoose.model<AIDocument<IBlogPost>>(
  "BlogPost",
  blogSchema
) as AIModelType<IBlogPost>;

// Full IntelliSense support
const results = await BlogPost.semanticSearch("query"); // ✅ Typed
const summary = post.getAIContent(); // ✅ Typed
```

## 🛠️ Environment Setup

Create a `.env` file:

```bash
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017/your_database
```

Verify your setup:

```typescript
import { checkEnvironment } from "mongoose-ai";

const envCheck = checkEnvironment();
if (!envCheck.isValid) {
  console.error("Missing:", envCheck.missing);
  console.warn("Warnings:", envCheck.warnings);
}
```

## 🔒 Error Handling

The plugin includes robust error handling:

- **Graceful failures** - Documents save even if AI processing fails
- **Automatic retries** - Configurable retry logic for API failures
- **Detailed logging** - Comprehensive logging with configurable levels
- **Cost protection** - Built-in timeouts and rate limiting

```typescript
// Configure error handling
blogSchema.plugin(aiPlugin, {
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

## 📊 Semantic Search Examples

### Basic Search

```typescript
const results = await Product.semanticSearch("gaming laptop under $1000");
results.forEach((result) => {
  console.log(`${result.document.name} (${result.similarity.toFixed(3)})`);
});
```

### Advanced Search with Filters

```typescript
const results = await Product.semanticSearch("professional computer", {
  limit: 5,
  threshold: 0.6,
  filter: {
    price: { $lt: 2000 },
    inStock: true,
  },
});
```

### Finding Similar Items

```typescript
const laptop = await Product.findOne({ name: /macbook/i });
const similar = await Product.findSimilar(laptop, {
  limit: 3,
  threshold: 0.7,
});
```

## 🏷️ Requirements

- **Node.js** 16+
- **Mongoose** 7.x or 8.x
- **OpenAI API Key**
- **TypeScript** 5+ (for TypeScript projects)

## 📚 Examples

Check out the [examples directory](./examples) for complete usage examples:

- Basic summarization setup
- Semantic search implementation
- Advanced configuration patterns
- Performance monitoring
- Error handling strategies

## 📈 Scaling

mongoose-ai scales efficiently from prototype to enterprise. See our [Database Scaling Guide](docs/scaling-guide.md) for:

- Performance characteristics at different scales
- Optimization strategies and migration paths  
- Cost projections and infrastructure recommendations
- Monitoring and alerting best practices

**TL;DR**: Works perfectly up to 10K documents, requires optimization beyond 100K documents, enterprise solutions available for millions of documents.


## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) and submit pull requests to our repository.

## 📄 License

MIT © [Jonathan Moussa NDAO](https://github.com/jmndao)

## 🔗 Links

- [Documentation](https://github.com/jmndao/mongoose-ai#readme)
- [NPM Package](https://www.npmjs.com/package/mongoose-ai)
- [Issues](https://github.com/jmndao/mongoose-ai/issues)
- [Examples](https://github.com/jmndao/mongoose-ai/tree/main/examples)

---

**Made with ❤️ for the MongoDB community**
