# Performance Guide

Optimization strategies and scaling guidelines for mongoose-ai.

## Performance Metrics

Based on real-world benchmarks with mongoose-ai v1.1.0.

### Basic Processing Performance

**Summary Generation Only:**

- Processing time: ~1.4 seconds per document
- Throughput: 43+ documents per minute
- Token usage: ~280 tokens per document
- Cost: ~$0.42 per 1000 documents
- Memory usage: Minimal (document processing only)

### Function Calling Performance

**Summary + Automated Classification:**

- Processing time: ~2.1 seconds per document (50% overhead)
- Throughput: 29+ documents per minute
- Token usage: ~926 tokens per document (230% increase)
- Cost: ~$1.39 per 1000 documents
- Memory usage: Minimal (same as basic)
- Value: Eliminates manual classification time

### Scaling Characteristics

| Document Count | Basic Processing | Function Calling | Recommended Approach             |
| -------------- | ---------------- | ---------------- | -------------------------------- |
| < 1K           | $0.42            | $1.39            | Function calling for automation  |
| 1K - 10K       | $4.20            | $13.90           | Function calling acceptable      |
| 10K - 100K     | $42              | $139             | Consider optimization strategies |
| 100K+          | $420+            | $1,390+          | Hybrid approach or alternatives  |

## Cost Optimization Strategies

### 1. Use Cheaper Models

**Switch to gpt-4o-mini (10x cheaper):**

```typescript
modelConfig: {
  chatModel: "gpt-4o-mini", // $0.00015/1k tokens vs $0.0015/1k
  maxTokens: 100, // Reduce from default 200
  temperature: 0.1, // Lower for consistency
}
```

**Cost Impact:** 90% reduction in API costs

### 2. Optimize Token Usage

**Shorter Prompts:**

```typescript
// Instead of verbose prompts
prompt: "Please analyze this content thoroughly and provide a comprehensive summary with detailed insights about the sentiment, priority level, and relevant categorization tags.";

// Use concise prompts
prompt: "Summarize in 1 sentence. Classify: positive/negative/neutral. Score 1-5. Add 2 tags.";
```

**Cost Impact:** 30-50% token reduction

### 3. Selective Processing

**Only Process Important Documents:**

```typescript
schema.pre("save", async function (next) {
  // Skip AI for draft documents
  if (this.status === "draft") {
    return next();
  }

  // Skip AI for short content
  if (this.content?.length < 100) {
    return next();
  }

  // Process normally
  next();
});
```

**Cost Impact:** 50-80% reduction depending on filtering criteria

### 4. Content-Based Caching

**Cache Results for Similar Content:**

```typescript
import crypto from "crypto";

const contentCache = new Map();

schema.pre("save", async function (next) {
  // Create content hash
  const contentHash = crypto
    .createHash("md5")
    .update(
      JSON.stringify({
        title: this.title,
        content: this.content,
      })
    )
    .digest("hex");

  // Check cache
  if (contentCache.has(contentHash)) {
    this.aiSummary = contentCache.get(contentHash);
    return next();
  }

  // Continue with AI processing
  next();
});

schema.post("save", function () {
  // Cache successful results
  if (this.aiSummary) {
    const contentHash = crypto
      .createHash("md5")
      .update(
        JSON.stringify({
          title: this.title,
          content: this.content,
        })
      )
      .digest("hex");

    contentCache.set(contentHash, this.aiSummary);
  }
});
```

**Cost Impact:** 60-90% reduction for duplicate/similar content

### 5. Batch Processing

**Process in Batches Instead of Real-time:**

```typescript
// Queue documents for batch processing
const processingQueue = [];

schema.pre("save", async function (next) {
  if (this.isNew && !this.aiSummary) {
    // Add to queue instead of immediate processing
    processingQueue.push(this._id);
    this.processingQueued = true;
  }
  next();
});

// Process queue periodically
const processBatch = async () => {
  const batch = processingQueue.splice(0, 10); // Process 10 at a time

  for (const docId of batch) {
    const doc = await Model.findById(docId);
    if (doc && doc.processingQueued) {
      await doc.regenerateAI();
      doc.processingQueued = false;
      await doc.save();
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

// Run batch processing every 5 minutes
setInterval(processBatch, 5 * 60 * 1000);
```

**Cost Impact:** No direct cost reduction, but better control and rate limiting

## Performance Optimization

### 1. Reduce Processing Time

**Optimize Configuration:**

```typescript
advanced: {
  maxRetries: 1, // Reduce from default 2-3
  timeout: 15000, // Reduce from default 30000
  logLevel: "error", // Minimal logging
}

modelConfig: {
  maxTokens: 80, // Reduce from default 200
  temperature: 0.1, // Faster, more consistent responses
}
```

**Performance Impact:** 20-30% faster processing

### 2. Parallel Processing

**Process Multiple Documents Concurrently:**

```typescript
const processDocumentsConcurrently = async (documents, concurrency = 3) => {
  const chunks = [];
  for (let i = 0; i < documents.length; i += concurrency) {
    chunks.push(documents.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (doc) => {
        try {
          await doc.save();
        } catch (error) {
          console.error(`Failed to process document ${doc._id}:`, error);
        }
      })
    );
  }
};
```

**Performance Impact:** 2-3x faster for bulk processing

### 3. Skip Updates

**Only Process New Documents:**

```typescript
advanced: {
  skipOnUpdate: true, // Only process new documents
  forceRegenerate: false, // Don't regenerate existing AI content
}
```

**Performance Impact:** Eliminates unnecessary reprocessing

### 4. Field Filtering

**Process Only Relevant Fields:**

```typescript
includeFields: ["title", "content"], // Only these fields
excludeFields: ["metadata", "internalNotes"], // Skip these fields
```

**Performance Impact:** 10-20% token reduction

## Scaling Strategies

### Small Scale (< 1K documents)

**Recommended Configuration:**

```typescript
schema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai",
    model: "summary",
    field: "aiSummary",
    advanced: {
      enableFunctions: true,
      logLevel: "info",
    },
    modelConfig: {
      chatModel: "gpt-4", // Use best quality
      maxTokens: 200,
      temperature: 0.3,
    },
    functions: [
      QuickFunctions.updateField("sentiment", [
        "positive",
        "negative",
        "neutral",
      ]),
      QuickFunctions.scoreField("priority", 1, 5),
      QuickFunctions.manageTags("tags"),
    ],
  }),
});
```

**Characteristics:**

- Real-time processing
- Full function calling
- High quality models
- Detailed logging

### Medium Scale (1K - 10K documents)

**Recommended Configuration:**

```typescript
schema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai",
    model: "summary",
    field: "aiSummary",
    advanced: {
      enableFunctions: true,
      logLevel: "warn",
      maxRetries: 2,
    },
    modelConfig: {
      chatModel: "gpt-4o-mini", // Cheaper model
      maxTokens: 150, // Reduced tokens
      temperature: 0.2,
    },
    functions: [
      QuickFunctions.updateField("sentiment", [
        "positive",
        "negative",
        "neutral",
      ]),
      QuickFunctions.scoreField("priority", 1, 5),
    ], // Fewer functions
  }),
});
```

**Optimizations:**

- Cheaper model (gpt-4o-mini)
- Reduced token limits
- Fewer functions
- Less verbose logging

### Large Scale (10K - 100K documents)

**Recommended Configuration:**

```typescript
// Basic processing for most documents
const basicConfig = createAIConfig({
  apiKey: process.env.OPENAI_API_KEY,
  model: "summary",
  field: "aiSummary",
  advanced: {
    skipOnUpdate: true,
    logLevel: "error",
  },
  modelConfig: {
    chatModel: "gpt-4o-mini",
    maxTokens: 100,
    temperature: 0.1,
  },
});

// Function calling only for important documents
const premiumConfig = createAdvancedAIConfig({
  apiKey: process.env.OPENAI_API_KEY,
  provider: "openai",
  model: "summary",
  field: "aiSummary",
  advanced: {
    enableFunctions: true,
    logLevel: "error",
  },
  functions: [
    QuickFunctions.updateField("sentiment", [
      "positive",
      "negative",
      "neutral",
    ]),
  ],
});

// Conditional configuration
schema.plugin(aiPlugin, {
  ai: (document) => {
    return document.priority === "high" ? premiumConfig : basicConfig;
  },
});
```

**Optimizations:**

- Hybrid approach
- Function calling only for important documents
- Aggressive caching
- Batch processing

### Enterprise Scale (100K+ documents)

**Hybrid Architecture with MongoDB Atlas Vector Search:**

```typescript
// Use mongoose-ai for classification only
const classificationSchema = new mongoose.Schema({
  title: String,
  content: String,
  // AI classification fields
  sentiment: String,
  priority: Number,
  category: String,
});

classificationSchema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai",
    model: "summary",
    field: "aiSummary",
    advanced: {
      enableFunctions: true,
      logLevel: "error",
    },
    functions: [
      QuickFunctions.updateField("sentiment", [
        "positive",
        "negative",
        "neutral",
      ]),
      QuickFunctions.scoreField("priority", 1, 5),
      QuickFunctions.updateField("category", ["tech", "business", "personal"]),
    ],
  }),
});

// Use MongoDB Atlas Vector Search for similarity search
const vectorSchema = new mongoose.Schema({
  title: String,
  content: String,
  embedding: [Number], // Generated separately
  sentiment: String,
  priority: Number,
  category: String,
});

// Create vector search index
vectorSchema.index(
  {
    embedding: "vectorSearch",
  },
  {
    type: "vectorSearch",
    definition: {
      mappings: {
        fields: {
          embedding: {
            type: "knnVector",
            dimensions: 1536,
            similarity: "cosine",
          },
        },
      },
    },
  }
);
```

**Benefits:**

- 96% cost reduction for similarity search
- mongoose-ai handles classification
- MongoDB Atlas handles vector operations
- Scales to millions of documents

## MongoDB Atlas Vector Search Integration

For large-scale applications, consider using MongoDB Atlas Vector Search for similarity operations while keeping mongoose-ai for classification:

### Cost Comparison

**mongoose-ai Only (100K documents):**

- Classification + Embeddings: $1,390/month
- Total: $1,390/month

**Hybrid Approach (100K documents):**

- mongoose-ai (classification only): $139/month
- MongoDB Atlas Vector Search: $60/month
- OpenAI embeddings (one-time): $20
- Total: $219/month (84% savings)

### Implementation

```typescript
// Step 1: Use mongoose-ai for classification
const doc = new ClassificationModel({
  title: "Product Review",
  content: "Great product, highly recommend!",
});
await doc.save();
// AI populates: sentiment="positive", priority=4, category="review"

// Step 2: Generate embeddings separately
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: doc.content,
});

// Step 3: Store in vector search enabled collection
await VectorModel.create({
  ...doc.toObject(),
  embedding: embedding.data[0].embedding,
});

// Step 4: Use MongoDB Atlas Vector Search for similarity
const results = await VectorModel.aggregate([
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: queryEmbedding,
      numCandidates: 100,
      limit: 10,
    },
  },
]);
```

## Monitoring and Debugging

### Performance Monitoring

```typescript
// Track processing times
const processingTimes = [];

schema.post("save", function () {
  if (this.aiSummary?.processingTime) {
    processingTimes.push(this.aiSummary.processingTime);

    // Calculate averages
    if (processingTimes.length % 100 === 0) {
      const avg =
        processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
      console.log(`Average processing time: ${avg}ms`);
    }
  }
});
```

### Cost Tracking

```typescript
let dailyCost = 0;
let dailyTokens = 0;

schema.post("save", function () {
  if (this.aiSummary?.tokenCount) {
    const tokens = this.aiSummary.tokenCount;
    const cost = estimateCost(tokens, "gpt-4o-mini", "openai");

    dailyTokens += tokens;
    dailyCost += cost;

    console.log(`Daily usage: ${dailyTokens} tokens, ${dailyCost.toFixed(4)}`);
  }
});
```

### Error Rate Monitoring

```typescript
let successCount = 0;
let errorCount = 0;

schema.post("save", function (error, doc, next) {
  if (error) {
    errorCount++;
  } else if (doc.aiSummary) {
    successCount++;
  }

  const total = successCount + errorCount;
  if (total % 100 === 0) {
    const successRate = ((successCount / total) * 100).toFixed(1);
    console.log(`Success rate: ${successRate}%`);
  }

  next();
});
```

## Best Practices for Scale

### 1. Design for Failure

```typescript
advanced: {
  continueOnError: true, // Always save documents
  maxRetries: 1, // Don't retry too much at scale
  timeout: 10000, // Shorter timeouts
}
```

### 2. Implement Circuit Breakers

```typescript
let consecutiveFailures = 0;
let isCircuitOpen = false;

schema.pre("save", async function (next) {
  if (isCircuitOpen) {
    console.log("Circuit breaker open, skipping AI processing");
    return next();
  }

  try {
    // AI processing happens here
    consecutiveFailures = 0; // Reset on success
    next();
  } catch (error) {
    consecutiveFailures++;

    if (consecutiveFailures >= 5) {
      isCircuitOpen = true;
      setTimeout(() => {
        isCircuitOpen = false;
        consecutiveFailures = 0;
      }, 60000); // Open for 1 minute
    }

    next(error);
  }
});
```

### 3. Use Environment-Based Configuration

```typescript
const getConfig = () => {
  const env = process.env.NODE_ENV;

  if (env === "development") {
    return {
      modelConfig: { chatModel: "gpt-4" },
      advanced: { logLevel: "debug" },
    };
  }

  if (env === "staging") {
    return {
      modelConfig: { chatModel: "gpt-4o-mini" },
      advanced: { logLevel: "info" },
    };
  }

  // Production
  return {
    modelConfig: {
      chatModel: "gpt-4o-mini",
      maxTokens: 100,
    },
    advanced: {
      logLevel: "error",
      maxRetries: 1,
    },
  };
};
```

### 4. Implement Graceful Degradation

```typescript
schema.pre("save", async function (next) {
  // Check API rate limits
  if (await isRateLimited()) {
    console.log("Rate limited, queuing for later processing");
    this.needsAIProcessing = true;
    return next();
  }

  // Check API status
  if (await isAPIDown()) {
    console.log("API unavailable, skipping AI processing");
    return next();
  }

  // Process normally
  next();
});
```

## Alternative Architectures

### Queue-Based Processing

```typescript
// Use Bull Queue for background processing
import Queue from "bull";

const aiProcessingQueue = new Queue("AI processing", {
  redis: { port: 6379, host: "127.0.0.1" },
});

schema.post("save", function () {
  if (this.isNew && !this.aiSummary) {
    aiProcessingQueue.add("process-document", {
      documentId: this._id,
      modelName: this.constructor.modelName,
    });
  }
});

aiProcessingQueue.process("process-document", async (job) => {
  const { documentId, modelName } = job.data;
  const Model = mongoose.model(modelName);
  const doc = await Model.findById(documentId);

  if (doc) {
    await doc.regenerateAI();
    await doc.save();
  }
});
```

### Microservice Architecture

```typescript
// Separate AI service
const processWithAIService = async (document) => {
  const response = await fetch("http://ai-service:3000/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: document.title,
      content: document.content,
    }),
  });

  return response.json();
};

schema.post("save", async function () {
  if (this.isNew) {
    try {
      const aiResult = await processWithAIService(this);
      this.aiSummary = aiResult.summary;
      this.sentiment = aiResult.sentiment;
      await this.save();
    } catch (error) {
      console.error("AI service error:", error);
    }
  }
});
```

## Recommendations by Scale

### Summary

| Scale              | Approach                   | Configuration          | Expected Cost |
| ------------------ | -------------------------- | ---------------------- | ------------- |
| Small (< 1K)       | Real-time function calling | gpt-4, full features   | $1.39/month   |
| Medium (1K-10K)    | Optimized function calling | gpt-4o-mini, selective | $14/month     |
| Large (10K-100K)   | Hybrid approach            | Basic + premium tiers  | $50-100/month |
| Enterprise (100K+) | Atlas Vector + mongoose-ai | Classification only    | $200/month    |

Choose the approach that matches your scale, budget, and performance requirements. mongoose-ai provides flexibility to optimize for any scenario.
