# Migration Guide

Guide for upgrading from previous versions of mongoose-ai.

## Upgrading from v1.0.x to v1.1.0

mongoose-ai v1.1.0 is **100% backward compatible** with v1.0.x. Your existing code will continue to work without any changes.

### No Breaking Changes

All existing v1.0.x configurations continue to work:

```typescript
// This v1.0.x code works unchanged in v1.1.0
schema.plugin(aiPlugin, {
  ai: {
    model: "summary",
    provider: "openai", // This was implied in v1.0.x
    field: "aiSummary",
    credentials: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    prompt: "Summarize this content:",
    includeFields: ["title", "content"],
    excludeFields: ["privateNotes"],
  },
});
```

### New Features in v1.1.0

#### 1. Function Calling (Opt-in)

Enable AI to automatically update document fields:

```typescript
// v1.0.x - Basic processing only
schema.plugin(aiPlugin, {
  ai: {
    model: "summary",
    field: "aiSummary",
    credentials: { apiKey: "..." },
  },
});

// v1.1.0 - Add function calling
import { createAdvancedAIConfig, QuickFunctions } from "@jmndao/mongoose-ai";

schema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai", // Now explicit
    model: "summary",
    field: "aiSummary",
    advanced: {
      enableFunctions: true, // New: Enable function calling
    },
    functions: [
      // New: Add functions
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

#### 2. Multi-Provider Support

Add Anthropic Claude support alongside OpenAI:

```typescript
// v1.0.x - OpenAI only (implied)
schema.plugin(aiPlugin, {
  ai: {
    model: "summary",
    field: "aiSummary",
    credentials: { apiKey: process.env.OPENAI_API_KEY },
  },
});

// v1.1.0 - Choose provider explicitly
schema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.ANTHROPIC_API_KEY,
    provider: "anthropic", // New: Anthropic support
    model: "summary", // Note: Anthropic doesn't support embeddings
    field: "aiSummary",
  }),
});
```

#### 3. Enhanced Configuration

More control over AI processing:

```typescript
// v1.0.x - Basic configuration
schema.plugin(aiPlugin, {
  ai: {
    model: "summary",
    field: "aiSummary",
    credentials: { apiKey: "..." },
  },
});

// v1.1.0 - Advanced configuration
schema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai",
    model: "summary",
    field: "aiSummary",
    advanced: {
      // New: Advanced options
      enableFunctions: true,
      maxRetries: 3,
      timeout: 45000,
      skipOnUpdate: true,
      logLevel: "info",
    },
    modelConfig: {
      // New: Model-specific config
      chatModel: "gpt-4",
      maxTokens: 150,
      temperature: 0.2,
    },
  }),
});
```

## Migration Strategies

### Strategy 1: No Changes (Recommended for Most)

If your current implementation works well, no changes are needed:

```typescript
// Keep your existing v1.0.x code unchanged
schema.plugin(aiPlugin, {
  ai: {
    model: "summary",
    field: "aiSummary",
    credentials: { apiKey: process.env.OPENAI_API_KEY },
  },
});

// Everything continues to work exactly the same
```

**When to use:**

- Current implementation meets your needs
- No need for automated field classification
- Want to minimize changes

### Strategy 2: Gradual Migration

Add new features to new schemas while keeping existing ones unchanged:

```typescript
// Existing schemas - keep unchanged
const articleSchema = new mongoose.Schema({...});
articleSchema.plugin(aiPlugin, {
  ai: {
    model: "summary",
    field: "aiSummary",
    credentials: { apiKey: process.env.OPENAI_API_KEY },
  },
});

// New schemas - use v1.1.0 features
const reviewSchema = new mongoose.Schema({
  text: String,
  sentiment: String, // Will be populated by AI
  rating: Number,    // Will be populated by AI
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
      QuickFunctions.updateField("sentiment", ["positive", "negative", "neutral"]),
      QuickFunctions.scoreField("rating", 1, 5),
    ],
  }),
});
```

**When to use:**

- Want to try new features without risk
- Have both legacy and new requirements
- Need time to evaluate new features

### Strategy 3: Full Migration

Upgrade all schemas to use new configuration format:

```typescript
// Before (v1.0.x)
const oldConfig = {
  model: "summary",
  field: "aiSummary",
  credentials: { apiKey: process.env.OPENAI_API_KEY },
  prompt: "Summarize this content:",
  includeFields: ["title", "content"],
};

// After (v1.1.0)
const newConfig = createAdvancedAIConfig({
  apiKey: process.env.OPENAI_API_KEY,
  provider: "openai", // Now explicit
  model: "summary",
  field: "aiSummary",
  prompt: "Summarize this content:",
  includeFields: ["title", "content"],
  // Optionally add new features
  advanced: {
    enableFunctions: false, // Keep disabled initially
    logLevel: "info",
  },
});

schema.plugin(aiPlugin, { ai: newConfig });
```

**When to use:**

- Want consistent configuration across all schemas
- Plan to use new features eventually
- Prefer explicit configuration

## Adding Function Calling to Existing Schemas

### Step 1: Add Fields to Schema

Add fields that AI will populate:

```typescript
// Before - Basic schema
const reviewSchema = new mongoose.Schema({
  productName: String,
  reviewText: String,
});

// After - Add AI-populated fields
const reviewSchema = new mongoose.Schema({
  productName: String,
  reviewText: String,
  // New fields for AI to populate
  sentiment: String,
  helpfulnessScore: Number,
  topics: [String],
});
```

### Step 2: Update Configuration

Enable function calling and add functions:

```typescript
// Before - Basic processing
reviewSchema.plugin(aiPlugin, {
  ai: {
    model: "summary",
    field: "aiSummary",
    credentials: { apiKey: process.env.OPENAI_API_KEY },
  },
});

// After - Add function calling
reviewSchema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai",
    model: "summary",
    field: "aiSummary",
    advanced: {
      enableFunctions: true, // Enable function calling
    },
    functions: [
      QuickFunctions.updateField("sentiment", [
        "positive",
        "negative",
        "neutral",
      ]),
      QuickFunctions.scoreField("helpfulnessScore", 1, 10),
      QuickFunctions.manageTags("topics"),
    ],
  }),
});
```

### Step 3: Handle Existing Documents

Existing documents won't have the new fields populated. You can:

**Option A: Regenerate AI content for all documents**

```typescript
// Regenerate AI for all existing documents
const regenerateAll = async () => {
  const documents = await ReviewModel.find({ sentiment: { $exists: false } });

  for (const doc of documents) {
    try {
      await doc.regenerateAI();
      await doc.save();
      console.log(`Updated document ${doc._id}`);
    } catch (error) {
      console.error(`Failed to update ${doc._id}:`, error);
    }
  }
};

await regenerateAll();
```

**Option B: Regenerate on access**

```typescript
// Add middleware to regenerate on first access
reviewSchema.pre("findOne", async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc && !doc.sentiment) {
    await doc.regenerateAI();
    await doc.save();
  }
});
```

**Option C: Background processing**

```typescript
// Queue existing documents for background processing
const queueExistingDocs = async () => {
  const cursor = ReviewModel.find({ sentiment: { $exists: false } }).cursor();

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    // Add to processing queue
    await processingQueue.add("regenerate-ai", { docId: doc._id });
  }
};
```

## Environment Variable Changes

### v1.0.x Environment

```bash
# v1.0.x - Only OpenAI supported
OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb://localhost:27017/myapp
```

### v1.1.0 Environment

```

```
