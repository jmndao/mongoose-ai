# Performance Guide

Optimization strategies and scaling guidelines for mongoose-ai across all providers.

## Performance Metrics

Based on real-world benchmarks with mongoose-ai v1.5.0.

### Cloud Provider Performance

**OpenAI Summary Generation:**

- Processing time: ~1.4 seconds per document
- Throughput: 43+ documents per minute
- Token usage: ~280 tokens per document
- Cost: ~$0.42 per 1000 documents

**OpenAI Function Calling:**

- Processing time: ~2.1 seconds per document (50% overhead)
- Throughput: 29+ documents per minute
- Token usage: ~926 tokens per document (230% increase)
- Cost: ~$1.39 per 1000 documents

**Anthropic Performance:**

- Processing time: ~1.8 seconds per document
- Superior function calling accuracy
- Cost: ~$0.23 per 1000 documents (basic processing)

### Local Provider Performance (Ollama)

**Hardware-Dependent Performance:**

| Hardware           | Processing Time | Throughput     | Cost  |
| ------------------ | --------------- | -------------- | ----- |
| CPU Only (8 cores) | 8-15 seconds    | 4-8 docs/min   | $0.00 |
| GPU (RTX 4080)     | 3-6 seconds     | 10-20 docs/min | $0.00 |
| GPU (RTX 4090)     | 2-4 seconds     | 15-30 docs/min | $0.00 |
| Apple M2 Pro       | 4-8 seconds     | 8-15 docs/min  | $0.00 |
| Apple M3 Max       | 2-5 seconds     | 12-30 docs/min | $0.00 |

**Ollama Model Performance:**

| Model     | Size  | RAM Required | Speed  | Quality     |
| --------- | ----- | ------------ | ------ | ----------- |
| llama3.2  | 2GB   | 4GB          | Fast   | Good        |
| llama2    | 3.8GB | 6GB          | Medium | Good        |
| mistral   | 4GB   | 6GB          | Medium | Very Good   |
| codellama | 3.8GB | 6GB          | Medium | Good (Code) |

### Scaling Characteristics

| Document Count | Cloud Processing | Local Processing | Recommended Approach   |
| -------------- | ---------------- | ---------------- | ---------------------- |
| < 1K           | $0.42-$1.39      | $0.00            | Local for learning/dev |
| 1K - 10K       | $4.20-$13.90     | $0.00            | Local for cost savings |
| 10K - 100K     | $42-$139         | $0.00            | Hybrid approach        |
| 100K+          | $420+            | $0.00            | Strategic choice       |

## Cost Optimization Strategies

### 1. Provider Selection by Use Case

**Use Ollama (Free) for:**

```typescript
// Development and testing
const devConfig = createOllamaConfig({
  model: "summary",
  field: "aiSummary",
  chatModel: "llama3.2",
});

// Internal document processing
// Privacy-sensitive content
// High-volume processing
// Learning and experimentation
```

**Use Cloud Providers for:**

```typescript
// Production customer-facing features
const prodConfig = createAdvancedAIConfig({
  apiKey: process.env.OPENAI_API_KEY,
  provider: "openai",
  model: "summary",
  field: "aiSummary",
  modelConfig: { chatModel: "gpt-4o-mini" }, // Cost-effective
});

// When accuracy is critical
// When processing speed is important
// When you need embeddings and don't have local GPU
```

### 2. Hybrid Cost Strategy

**Tier-Based Processing:**

```typescript
const getConfigByPriority = (document) => {
  if (document.priority === "high") {
    // Use premium cloud processing
    return createAdvancedAIConfig({
      apiKey: process.env.OPENAI_API_KEY,
      provider: "openai",
      model: "summary",
      field: "aiSummary",
      modelConfig: { chatModel: "gpt-4" },
    });
  }

  // Use free local processing for everything else
  return createOllamaConfig({
    model: "summary",
    field: "aiSummary",
  });
};
```

**Environment-Based Strategy:**

```typescript
const getConfig = () => {
  if (process.env.NODE_ENV === "development") {
    return createOllamaConfig({ model: "summary", field: "aiSummary" });
  }

  if (process.env.NODE_ENV === "staging") {
    return createAdvancedAIConfig({
      apiKey: process.env.OPENAI_API_KEY,
      provider: "openai",
      model: "summary",
      field: "aiSummary",
      modelConfig: { chatModel: "gpt-4o-mini" },
    });
  }

  // Production
  return createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai",
    model: "summary",
    field: "aiSummary",
    modelConfig: { chatModel: "gpt-4" },
  });
};
```

### 3. Optimize Cloud Provider Usage

**Use Cheaper Models:**

```typescript
modelConfig: {
  chatModel: "gpt-4o-mini", // 10x cheaper than gpt-4
  maxTokens: 100, // Reduce from default 200
  temperature: 0.1, // Lower for consistency
}
```

**Optimize Token Usage:**

```typescript
// Concise prompts save tokens
prompt: "Summarize in 1 sentence. Classify: positive/negative/neutral. Score 1-5.";

// vs verbose prompts
prompt: "Please analyze this content thoroughly and provide a comprehensive summary...";
```

### 4. Ollama Performance Optimization

**Model Selection:**

```typescript
// For speed (smaller models)
chatModel: "llama3.2"; // 2GB, fastest
embeddingModel: "nomic-embed-text"; // Optimized for embeddings

// For quality (larger models)
chatModel: "mistral"; // 4GB, better quality
chatModel: "codellama"; // 3.8GB, specialized for code
```

**Hardware Optimization:**

```typescript
// Configure timeouts for hardware
advanced: {
  timeout: 60000,  // Longer timeout for CPU-only systems
  maxRetries: 1,   // Fewer retries for local processing
  logLevel: "info", // Monitor performance
}
```

## Performance Optimization

### 1. Processing Time Optimization

**Cloud Providers:**

```typescript
advanced: {
  maxRetries: 1, // Reduce retries
  timeout: 15000, // Shorter timeout
  logLevel: "error", // Minimal logging
}

modelConfig: {
  maxTokens: 80, // Shorter responses
  temperature: 0.1, // Faster generation
}
```

**Ollama:**

```typescript
// Use appropriate models for hardware
const getOllamaModel = () => {
  const hasGPU = checkGPUAvailability();
  const ramGB = getAvailableRAM();

  if (hasGPU && ramGB > 8) {
    return "mistral"; // Better quality with sufficient resources
  }

  return "llama3.2"; // Faster with limited resources
};
```

### 2. Parallel Processing

**Safe Concurrency Limits:**

```typescript
// Cloud providers - respect rate limits
const processCloudDocuments = async (documents) => {
  const chunks = chunkArray(documents, 3); // 3 concurrent requests

  for (const chunk of chunks) {
    await Promise.all(chunk.map((doc) => doc.save()));
    await sleep(100); // Rate limiting
  }
};

// Ollama - higher concurrency possible
const processLocalDocuments = async (documents) => {
  const chunks = chunkArray(documents, 8); // More concurrent for local

  for (const chunk of chunks) {
    await Promise.all(chunk.map((doc) => doc.save()));
  }
};
```

### 3. Selective Processing

**Content-Based Processing:**

```typescript
schema.pre("save", async function (next) {
  // Skip AI for short content
  if (this.content?.length < 100) {
    return next();
  }

  // Use local processing for drafts
  if (this.status === "draft") {
    // Apply Ollama config
    return next();
  }

  // Use cloud processing for published content
  // Apply OpenAI config
  next();
});
```

## Scaling Strategies by Provider

### Small Scale (< 1K documents)

**Recommended: Start with Ollama**

```typescript
// Free development and learning
schema.plugin(aiPlugin, {
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
      QuickFunctions.scoreField("priority", 1, 5),
    ],
  }),
});
```

**Benefits:**

- Zero cost for experimentation
- Learn AI capabilities without financial commitment
- Perfect for MVPs and prototypes

### Medium Scale (1K - 10K documents)

**Recommended: Hybrid Approach**

```typescript
// Ollama for bulk processing
const bulkConfig = createOllamaConfig({
  model: "summary",
  field: "aiSummary",
});

// Cloud for critical processing
const criticalConfig = createAdvancedAIConfig({
  apiKey: process.env.OPENAI_API_KEY,
  provider: "openai",
  model: "summary",
  field: "aiSummary",
  modelConfig: { chatModel: "gpt-4o-mini" },
});

// Route based on importance
const getConfig = (document) => {
  return document.isCritical ? criticalConfig : bulkConfig;
};
```

**Benefits:**

- Significant cost savings (60-90% reduction)
- High quality for important content
- Flexibility to adjust based on budget

### Large Scale (10K - 100K documents)

**Recommended: Strategic Ollama + Selective Cloud**

```typescript
// Default to local processing
const defaultConfig = createOllamaConfig({
  model: "summary",
  field: "aiSummary",
  advanced: { logLevel: "error" },
});

// Premium processing for customer-facing content
const premiumConfig = createAdvancedAIConfig({
  apiKey: process.env.OPENAI_API_KEY,
  provider: "openai",
  model: "summary",
  field: "aiSummary",
  modelConfig: { chatModel: "gpt-4" },
});

// Smart routing
schema.pre("save", function () {
  if (this.isCustomerFacing || this.priority === "high") {
    this.usePremmiumAI = true;
  }
});
```

**Benefits:**

- 80-95% cost reduction
- Premium quality where it matters
- Scalable infrastructure

### Enterprise Scale (100K+ documents)

**Recommended: Ollama-First with Cloud Integration**

```typescript
// Primary processing with Ollama
const primaryConfig = createOllamaConfig({
  model: "embedding",
  field: "aiEmbedding",
  embeddingModel: "nomic-embed-text",
  advanced: {
    skipOnUpdate: true,
    logLevel: "error",
  },
});

// Cloud processing for specific use cases
const cloudConfig = createAdvancedAIConfig({
  apiKey: process.env.OPENAI_API_KEY,
  provider: "openai",
  model: "embedding",
  field: "cloudEmbedding",
  modelConfig: { embeddingModel: "text-embedding-3-large" },
});

// Use MongoDB Atlas Vector Search for similarity
// Ollama for embeddings, Atlas for search performance
```

**Benefits:**

- Massive cost savings (95%+ reduction)
- Unlimited processing capability
- Strategic cloud usage for maximum benefit

## Vector Search Performance

### MongoDB Atlas Vector Search

**Performance Characteristics:**

```
1K documents:   5ms search time
10K documents:  8ms search time
100K documents: 12ms search time
1M+ documents:  15ms search time
```

**Setup for Different Providers:**

```typescript
// Works with both cloud and local embeddings
vectorSearch: {
  enabled: true,              // Auto-detects Atlas capability
  indexName: "embeddings_index",
  autoCreateIndex: true,
  similarity: "cosine",
}

// Embedding generation:
// - OpenAI: $0.00002 per 1K tokens
// - Ollama: $0.00 (free)
// Search: MongoDB Atlas pricing
```

### In-Memory Search Performance

**Performance Characteristics:**

```
1K documents:   50ms search time
10K documents:  500ms search time
100K documents: 5s search time
1M+ documents:  50s+ search time
```

## Performance Monitoring

### Track Processing Performance

```typescript
// Monitor processing times by provider
const performanceTracker = {
  ollama: [],
  openai: [],
  anthropic: [],
};

schema.post("save", function () {
  if (this.aiSummary?.processingTime) {
    const provider = this.aiSummary.provider || "unknown";
    performanceTracker[provider]?.push(this.aiSummary.processingTime);

    // Log averages every 100 documents
    if (performanceTracker[provider]?.length % 100 === 0) {
      const avg =
        performanceTracker[provider].reduce((a, b) => a + b, 0) /
        performanceTracker[provider].length;
      console.log(`${provider} average: ${avg}ms`);
    }
  }
});
```

### Cost Tracking

```typescript
// Track costs by provider
const costTracker = {
  dailyCosts: { openai: 0, anthropic: 0, ollama: 0 },
  dailyDocuments: { openai: 0, anthropic: 0, ollama: 0 },
};

schema.post("save", function () {
  if (this.aiSummary) {
    const provider = this.aiSummary.provider || "unknown";
    const tokens = this.aiSummary.tokenCount || 0;
    const cost = estimateCost(tokens, this.aiSummary.model, provider);

    costTracker.dailyCosts[provider] += cost;
    costTracker.dailyDocuments[provider]++;

    console.log(
      `${provider}: ${
        costTracker.dailyDocuments[provider]
      } docs, $${costTracker.dailyCosts[provider].toFixed(4)}`
    );
  }
});
```

## Best Practices by Provider

### Ollama Best Practices

**Hardware Optimization:**

- Use GPU when available for 2-5x speed improvement
- Ensure sufficient RAM (model size + 2GB minimum)
- Use SSD storage for faster model loading

**Model Management:**

- Download models locally: `ollama pull llama3.2`
- Use appropriate model sizes for your hardware
- Consider model switching based on workload

**Error Handling:**

```typescript
// Robust error handling for local processing
advanced: {
  continueOnError: true,  // Don't fail if Ollama is down
  timeout: 60000,         // Longer timeouts for CPU processing
  maxRetries: 1,          // Fewer retries for local
}
```

### Cloud Provider Best Practices

**Cost Management:**

- Use cheaper models when possible (gpt-4o-mini)
- Implement rate limiting to avoid quota issues
- Monitor usage and set billing alerts

**Performance:**

- Use appropriate timeout values
- Implement exponential backoff for retries
- Monitor API response times

## Recommendations by Scale

### Summary Table

| Scale                  | Recommended Approach           | Monthly Cost (Est.) | Setup Complexity     |
| ---------------------- | ------------------------------ | ------------------- | -------------------- |
| **Small (< 1K)**       | Ollama only                    | $0.00               | Medium (local setup) |
| **Medium (1K-10K)**    | Ollama + selective cloud       | $2-20               | Medium               |
| **Large (10K-100K)**   | Ollama primary + cloud premium | $20-100             | High                 |
| **Enterprise (100K+)** | Ollama + Atlas Vector Search   | $50-200             | High                 |

### Decision Framework

**Choose Ollama when:**

- Budget is primary concern
- Privacy/compliance is critical
- Processing volume is high
- Quality requirements are moderate
- You have adequate hardware

**Choose Cloud Providers when:**

- Quality is primary concern
- Processing speed is critical
- You need guaranteed uptime
- Hardware management is not desired
- Budget allows for convenience

**Choose Hybrid when:**

- You want best of both worlds
- Different quality needs for different content
- Cost optimization is important
- You have diverse use cases

The key is to match your provider choice to your specific requirements: budget, quality, privacy, and scale. mongoose-ai's flexible architecture allows you to optimize for any combination of these factors.
