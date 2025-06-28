# Configuration

All the options for setting up mongoose-ai with cloud providers, local LLMs, and vector search support.

## Quick Start Configurations

### Cloud AI (OpenAI/Anthropic)

```typescript
schema.plugin(aiPlugin, {
  ai: {
    model: "summary", // or "embedding"
    provider: "openai", // or "anthropic"
    field: "aiSummary", // where to store AI results
    credentials: {
      apiKey: "your-key-here",
    },
  },
});
```

### Local AI (Ollama)

```typescript
import { createOllamaConfig } from "@jmndao/mongoose-ai";

schema.plugin(aiPlugin, {
  ai: createOllamaConfig({
    model: "summary", // or "embedding"
    field: "aiSummary", // where to store AI results
    chatModel: "llama3.2", // or llama2, mistral, etc.
  }),
});
```

## Provider Comparison

| Option      | Cloud (OpenAI/Anthropic) | Local (Ollama)         |
| ----------- | ------------------------ | ---------------------- |
| Setup       | API key required         | Local installation     |
| Cost        | Pay per request          | $0.00                  |
| Privacy     | Data sent externally     | 100% local             |
| Performance | Excellent                | Hardware dependent     |
| Offline     | No                       | Yes                    |
| Use Cases   | Production apps          | Privacy/Cost sensitive |

## Basic Options

| Option               | Required | Description                               |
| -------------------- | -------- | ----------------------------------------- |
| `model`              | Yes      | `"summary"` or `"embedding"`              |
| `provider`           | Yes      | `"openai"` \| `"anthropic"` \| `"ollama"` |
| `field`              | Yes      | Field name for AI results                 |
| `credentials.apiKey` | Yes\*    | Your API key (\*Not needed for Ollama)    |
| `prompt`             | No       | Custom prompt for AI                      |
| `includeFields`      | No       | Only process these fields                 |
| `excludeFields`      | No       | Skip these fields                         |

## Advanced Setup

### Cloud Providers with All Features

```typescript
import { createAdvancedAIConfig } from "@jmndao/mongoose-ai";

schema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai", // or "anthropic"
    model: "embedding", // Enable semantic search
    field: "aiEmbedding",

    // Vector search configuration (optional - auto-detected)
    vectorSearch: {
      enabled: true, // Auto-detects MongoDB Atlas capability
      indexName: "vector_index", // Default index name
      autoCreateIndex: true, // Create index automatically
      similarity: "cosine", // Similarity metric
    },

    // Optional advanced settings
    advanced: {
      enableFunctions: true,
      maxRetries: 3,
      timeout: 30000,
      logLevel: "info",
    },

    // Model-specific settings
    modelConfig: {
      chatModel: "gpt-4",
      embeddingModel: "text-embedding-3-small",
      maxTokens: 200,
      temperature: 0.3,
    },

    // Functions for AI to call
    functions: [QuickFunctions.updateField("category")],
  }),
});
```

### Local LLM with Full Features

```typescript
import { createOllamaConfig } from "@jmndao/mongoose-ai";

schema.plugin(aiPlugin, {
  ai: createOllamaConfig({
    model: "embedding", // Enable semantic search
    field: "aiEmbedding",

    // Ollama-specific settings
    endpoint: "http://localhost:11434", // Default Ollama endpoint
    chatModel: "llama3.2",
    embeddingModel: "nomic-embed-text",

    // Vector search works with Ollama too
    vectorSearch: {
      enabled: true,
      indexName: "local_embeddings",
    },

    // Advanced features
    advanced: {
      enableFunctions: true,
      logLevel: "info",
    },

    // Functions work with local models
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

## Configuration Options

### Advanced Options

| Option            | Default  | Description                    |
| ----------------- | -------- | ------------------------------ |
| `enableFunctions` | `false`  | Allow AI to call functions     |
| `maxRetries`      | `2`      | Retry failed requests          |
| `timeout`         | `30000`  | Request timeout (ms)           |
| `skipOnUpdate`    | `false`  | Only process new documents     |
| `logLevel`        | `"warn"` | Logging level                  |
| `continueOnError` | `true`   | Save document even if AI fails |

### Vector Search Options

| Option            | Default          | Description                                     |
| ----------------- | ---------------- | ----------------------------------------------- |
| `enabled`         | `true`           | Enable vector search (auto-detects)             |
| `indexName`       | `"vector_index"` | Name of the vector search index                 |
| `autoCreateIndex` | `true`           | Automatically create missing indexes            |
| `similarity`      | `"cosine"`       | Similarity metric (cosine/euclidean/dotProduct) |

## Model Configuration

### OpenAI Models

```typescript
modelConfig: {
  chatModel: "gpt-4",                    // or "gpt-3.5-turbo", "gpt-4o-mini"
  embeddingModel: "text-embedding-3-small", // or "text-embedding-3-large"
  maxTokens: 200,                        // Response length
  temperature: 0.3,                      // Creativity (0-1)
}
```

### Anthropic Models

```typescript
modelConfig: {
  chatModel: "claude-3-sonnet-20240229", // or "claude-3-haiku-20240307"
  maxTokens: 200,
  temperature: 0.3,
}
```

Note: Anthropic doesn't support embeddings or semantic search.

### Ollama Models

```typescript
modelConfig: {
  chatModel: "llama3.2",           // or llama2, mistral, codellama, phi3
  embeddingModel: "nomic-embed-text", // or all-minilm
  maxTokens: 200,
  temperature: 0.3,
  endpoint: "http://localhost:11434", // Ollama server endpoint
}
```

Popular Ollama models:

- **Chat**: llama3.2, llama2, mistral, codellama, phi3
- **Embeddings**: nomic-embed-text, all-minilm

## Provider-Specific Setup

### OpenAI Setup

```typescript
ai: createAdvancedAIConfig({
  apiKey: process.env.OPENAI_API_KEY,
  provider: "openai",
  model: "embedding",
  field: "aiEmbedding",
  credentials: {
    organizationId: process.env.OPENAI_ORG_ID, // optional
  },
  modelConfig: {
    embeddingModel: "text-embedding-3-small",
    chatModel: "gpt-4o-mini", // Cost-effective option
  },
});
```

### Anthropic Setup

```typescript
ai: createAdvancedAIConfig({
  apiKey: process.env.ANTHROPIC_API_KEY,
  provider: "anthropic",
  model: "summary", // No embeddings available
  field: "aiSummary",
  modelConfig: {
    chatModel: "claude-3-sonnet-20240229",
    maxTokens: 150,
  },
});
```

### Ollama Setup

```typescript
// Basic local setup
ai: createOllamaConfig({
  model: "summary",
  field: "aiSummary",
  chatModel: "llama3.2",
});

// Advanced local setup
ai: createOllamaConfig({
  model: "embedding",
  field: "aiEmbedding",
  endpoint: "http://192.168.1.100:11434", // Remote Ollama server
  embeddingModel: "nomic-embed-text",
  advanced: {
    timeout: 60000, // Longer timeout for local processing
    logLevel: "info",
  },
});
```

## Environment Configuration

### Environment Variables

```bash
# Cloud providers (optional if using Ollama)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_ORG_ID=org-...

# MongoDB (Atlas recommended for vector search)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
# or for development
MONGODB_URI=mongodb://localhost:27017/myapp
```

### Ollama Setup

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Download models
ollama pull llama3.2          # For summaries
ollama pull nomic-embed-text  # For embeddings

# Start Ollama service
ollama serve

# Verify installation
ollama list
```

## Field Filtering

### Include Only Specific Fields

```typescript
ai: {
  // ... other config
  includeFields: ["title", "content", "description"],
}
```

### Exclude Sensitive Fields

```typescript
ai: {
  // ... other config
  excludeFields: ["password", "privateNotes", "adminComments"],
}
```

These fields are always excluded automatically:

- `_id`, `__v`, `createdAt`, `updatedAt`
- The AI field itself

## Custom Prompts

### Basic Prompts

```typescript
ai: {
  // ... other config
  prompt: "Create a professional summary highlighting key points:",
}
```

### Function Calling Prompts

```typescript
ai: createAdvancedAIConfig({
  // ... other config
  prompt: "Analyze this content. Classify sentiment, rate 1-5, and add tags.",
  functions: [
    QuickFunctions.updateField("sentiment", [
      "positive",
      "negative",
      "neutral",
    ]),
    QuickFunctions.scoreField("rating", 1, 5),
    QuickFunctions.manageTags("tags"),
  ],
});
```

## Error Handling

```typescript
advanced: {
  continueOnError: true,  // Save document even if AI fails
  maxRetries: 2,          // Retry failed requests
  timeout: 30000,         // 30 second timeout
  logLevel: "warn",       // Show warnings and errors
}
```

## Performance Optimization

### Cost Optimization

```typescript
// Use cheaper models
modelConfig: {
  chatModel: "gpt-4o-mini", // 10x cheaper than gpt-4
  maxTokens: 100,           // Shorter responses
  temperature: 0.1,         // More consistent
}

// Or use Ollama for zero cost
ai: createOllamaConfig({
  model: "summary",
  field: "aiSummary",
  chatModel: "llama3.2", // Free local processing
})
```

### Development vs Production

```typescript
const getConfig = () => {
  if (process.env.NODE_ENV === "development") {
    return createOllamaConfig({
      model: "summary",
      field: "aiSummary",
      advanced: { logLevel: "debug" },
    });
  }

  // Production
  return createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai",
    model: "summary",
    field: "aiSummary",
    modelConfig: { chatModel: "gpt-4o-mini" },
    advanced: { logLevel: "error" },
  });
};
```

## Validation

```typescript
import { checkEnvironment } from "@jmndao/mongoose-ai";

const check = checkEnvironment();
if (!check.isValid) {
  console.error("Missing:", check.missing);
  console.warn("Warnings:", check.warnings);
}
```

## Common Patterns

### Hybrid Setup (Multiple Providers)

```typescript
// Cheap processing for drafts
const draftConfig = createOllamaConfig({
  model: "summary",
  field: "draftSummary",
});

// Premium processing for published content
const publishedConfig = createAdvancedAIConfig({
  apiKey: process.env.OPENAI_API_KEY,
  provider: "openai",
  model: "summary",
  field: "publishedSummary",
});

// Apply based on document status
schema.pre("save", function () {
  if (this.status === "published") {
    // Use premium provider
  } else {
    // Use local provider
  }
});
```

### Conditional Processing

```typescript
schema.pre("save", async function (next) {
  // Skip AI for short content
  if (this.content?.length < 100) {
    return next();
  }

  // Skip AI for specific categories
  if (this.category === "system") {
    return next();
  }

  // Process normally
  next();
});
```

## Troubleshooting

**Ollama Connection Issues:**

- Verify Ollama is running: `ollama serve`
- Check models are downloaded: `ollama list`
- Test connection: `curl http://localhost:11434/api/tags`

**Vector Search Not Working:**

- Verify MongoDB Atlas setup
- Check vector search index exists
- Set `logLevel: "debug"` to see search method selection

**Function Calling Issues:**

- Ensure `enableFunctions: true`
- Check function parameter validation
- Use `logLevel: "debug"` to see function calls

**Performance Issues:**

- Use appropriate model sizes for your hardware (Ollama)
- Tune `numCandidates` for vector search
- Add MongoDB filters to reduce search space

## Next Steps

- [Function Calling](function-calling.md) - Auto-classification setup
- [Performance](performance.md) - Optimization strategies
- [API Reference](api-reference.md) - Complete method documentation
