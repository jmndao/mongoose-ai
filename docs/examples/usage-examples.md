# Usage Examples

This document provides practical examples for using mongoose-ai in real-world applications.

## Quick Start

### Installation

```bash
npm install @jmndao/mongoose-ai
```

### Basic Setup

```javascript
import mongoose from "mongoose";
import { aiPlugin } from "@jmndao/mongoose-ai";

// Add to your schema
const articleSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
});

// Enable AI summarization
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
```

## Common Use Cases

### 1. Blog Content Management

```javascript
// Auto-generate summaries for blog posts
const blogSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String,
  tags: [String],
});

blogSchema.plugin(aiPlugin, {
  ai: {
    model: "summary",
    provider: "openai",
    field: "summary",
    credentials: { apiKey: process.env.OPENAI_API_KEY },
    prompt: "Create an engaging summary for this blog post:",
    includeFields: ["title", "content"],
    excludeFields: ["author"],
  },
});

const BlogPost = mongoose.model("BlogPost", blogSchema);

// Usage
const post = new BlogPost({
  title: "AI in Modern Development",
  content: "Long article content...",
  category: "Technology",
});

await post.save(); // Summary generated automatically
console.log(post.summary.summary);
```

### 2. Product Catalog with Search

```javascript
// Enable semantic search for products
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  price: Number,
  features: [String],
});

productSchema.plugin(aiPlugin, {
  ai: {
    model: "embedding",
    provider: "openai",
    field: "searchEmbedding",
    credentials: { apiKey: process.env.OPENAI_API_KEY },
    includeFields: ["name", "description", "features"],
  },
});

const Product = mongoose.model("Product", productSchema);

// Search products naturally
const results = await Product.semanticSearch("wireless headphones for gaming", {
  limit: 5,
  threshold: 0.7,
});

results.forEach((result) => {
  console.log(`${result.document.name} (${result.similarity.toFixed(3)})`);
});
```

### 3. Knowledge Base

```javascript
// Create searchable documentation
const docSchema = new mongoose.Schema({
  title: String,
  content: String,
  section: String,
  tags: [String],
});

// Add both summary and search
docSchema.plugin(aiPlugin, {
  ai: {
    model: "summary",
    provider: "openai",
    field: "summary",
    credentials: { apiKey: process.env.OPENAI_API_KEY },
  },
});

// Clone for embeddings (avoid field conflicts)
const docEmbeddingSchema = docSchema.clone();
docEmbeddingSchema.plugin(aiPlugin, {
  ai: {
    model: "embedding",
    provider: "openai",
    field: "contentEmbedding",
    credentials: { apiKey: process.env.OPENAI_API_KEY },
  },
});

const Documentation = mongoose.model("Documentation", docEmbeddingSchema);
```

## Advanced Configuration

### Custom Prompts and Processing

```javascript
import { createAIConfig } from "@jmndao/mongoose-ai";

const newsSchema = new mongoose.Schema({
  headline: String,
  body: String,
  category: String,
  publishedAt: Date,
});

newsSchema.plugin(aiPlugin, {
  ai: createAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    model: "summary",
    field: "summary",
    prompt: "Create a professional news summary highlighting key facts:",
    includeFields: ["headline", "body"],
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

### Field Filtering

```javascript
// Process only specific fields
userSchema.plugin(aiPlugin, {
  ai: {
    model: "summary",
    provider: "openai",
    field: "profileSummary",
    credentials: { apiKey: process.env.OPENAI_API_KEY },
    includeFields: ["bio", "skills", "experience"], // Only these
    excludeFields: ["email", "password"], // Never these
  },
});
```

## Working with TypeScript

```typescript
import { AIDocument, AIModelType, WithAI } from "@jmndao/mongoose-ai";

interface IArticle {
  title: string;
  content: string;
  author: string;
  aiSummary?: SummaryResult;
}

const Article = mongoose.model<AIDocument<IArticle>>(
  "Article",
  articleSchema
) as AIModelType<IArticle>;

// Type-safe usage
const article = new Article({ title: "...", content: "..." });
await article.save();
const summary = article.getAIContent(); // Fully typed
```

## Manual Operations

### Regenerating AI Content

```javascript
// Force regenerate AI content
const article = await Article.findById(articleId);
await article.regenerateAI();

// Check if content exists
const currentSummary = article.getAIContent();
if (!currentSummary) {
  await article.regenerateAI();
}
```

### Similarity Calculations

```javascript
// Compare documents (embedding models only)
const product1 = await Product.findOne({ name: /laptop/ });
const product2 = await Product.findOne({ name: /notebook/ });

if (product1.calculateSimilarity) {
  const similarity = product1.calculateSimilarity(product2);
  console.log(`Similarity: ${(similarity * 100).toFixed(1)}%`);
}
```

### Finding Similar Content

```javascript
// Find related products
const laptop = await Product.findOne({ name: /macbook/ });
const similar = await Product.findSimilar(laptop, {
  limit: 5,
  threshold: 0.6,
  filter: { price: { $lt: 2000 } }, // Additional filters
});
```

## Performance Optimization

### Batch Processing

```javascript
// Process multiple documents efficiently
const articles = await Article.find({ aiSummary: { $exists: false } }).limit(
  50
);

for (const article of articles) {
  try {
    await article.save(); // Triggers AI processing
    console.log(`Processed: ${article.title}`);
  } catch (error) {
    console.error(`Failed: ${article.title}`, error);
  }
}
```

### Cost Monitoring

```javascript
import { estimateCost, estimateTokenCount } from "@jmndao/mongoose-ai";

// Estimate costs before processing
const content = "Your document content...";
const tokens = estimateTokenCount(content);
const cost = estimateCost(tokens, "gpt-3.5-turbo");

console.log(`Estimated cost: $${cost.toFixed(6)}`);

// Track actual usage
const articles = await Article.find();
const totalTokens = articles.reduce(
  (sum, article) => sum + (article.aiSummary?.tokenCount || 0),
  0
);
const totalCost = estimateCost(totalTokens, "gpt-3.5-turbo");
```

## Error Handling

### Graceful Degradation

```javascript
// Continue saving even if AI fails
schema.plugin(aiPlugin, {
  ai: {
    // ... config
    advanced: {
      continueOnError: true, // Don't fail document save
      maxRetries: 3,
      logLevel: "warn",
    },
  },
});
```

### Custom Error Handling

```javascript
// Handle AI processing errors
articleSchema.pre("save", function (next) {
  this.on("error", (error) => {
    if (error.message.includes("AI processing failed")) {
      console.warn(`AI failed for article: ${this.title}`);
      // Continue without AI content
      next();
    } else {
      next(error);
    }
  });
});
```

## Environment Setup

### Development

```bash
# .env file
OPENAI_API_KEY=sk-your-api-key-here
MONGODB_URI=mongodb://localhost:27017/your-database
```

### Production

```javascript
import { checkEnvironment } from "@jmndao/mongoose-ai";

// Validate environment before starting
const envCheck = checkEnvironment();
if (!envCheck.isValid) {
  console.error("Environment issues:", envCheck.missing);
  process.exit(1);
}
```

## Best Practices

1. **Use field filtering** to process only relevant data
2. **Set appropriate timeouts** for your use case
3. **Enable retry logic** for production environments
4. **Monitor costs** regularly with estimation utilities
5. **Test with small datasets** before scaling
6. **Use TypeScript** for better development experience
7. **Handle errors gracefully** to prevent data loss

## Need Help?

- Check the [API documentation](https://github.com/jmndao/mongoose-ai#readme)
- Review [performance guidelines](docs/scaling-guide.md)
- Open an issue on [GitHub](https://github.com/jmndao/mongoose-ai/issues)
