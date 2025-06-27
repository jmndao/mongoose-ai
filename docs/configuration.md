# Configuration

All the options for setting up mongoose-ai.

## Basic Setup

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

## All Basic Options

| Option               | Required | Description                  |
| -------------------- | -------- | ---------------------------- |
| `model`              | Yes      | `"summary"` or `"embedding"` |
| `provider`           | Yes      | `"openai"` or `"anthropic"`  |
| `field`              | Yes      | Field name for AI results    |
| `credentials.apiKey` | Yes      | Your API key                 |
| `prompt`             | No       | Custom prompt for AI         |
| `includeFields`      | No       | Only process these fields    |
| `excludeFields`      | No       | Skip these fields            |

## Advanced Setup

```typescript
import { createAdvancedAIConfig } from "@jmndao/mongoose-ai";

schema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai",
    model: "summary",
    field: "aiSummary",

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
      maxTokens: 200,
      temperature: 0.3,
    },

    // Functions for AI to call
    functions: [QuickFunctions.updateField("category")],
  }),
});
```

## Advanced Options

| Option            | Default  | Description                    |
| ----------------- | -------- | ------------------------------ |
| `enableFunctions` | `false`  | Allow AI to call functions     |
| `maxRetries`      | `2`      | Retry failed requests          |
| `timeout`         | `30000`  | Request timeout (ms)           |
| `skipOnUpdate`    | `false`  | Only process new documents     |
| `logLevel`        | `"warn"` | Logging level                  |
| `continueOnError` | `true`   | Save document even if AI fails |

## Model Settings

### OpenAI

```typescript
modelConfig: {
  chatModel: "gpt-4",                    // or "gpt-3.5-turbo", "gpt-4o-mini"
  embeddingModel: "text-embedding-3-small", // or "text-embedding-3-large"
  maxTokens: 200,                        // Response length
  temperature: 0.3,                      // Creativity (0-1)
}
```

### Anthropic

```typescript
modelConfig: {
  chatModel: "claude-3-sonnet-20240229", // or "claude-3-haiku-20240307"
  maxTokens: 200,
  temperature: 0.3,
}
```

Note: Anthropic doesn't support embeddings.

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

```typescript
ai: {
  // ... other config
  prompt: "Create a professional summary highlighting key points:",
}
```

For function calling:

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

## Provider Examples

### OpenAI Setup

```typescript
ai: {
  provider: "openai",
  model: "summary",
  field: "aiSummary",
  credentials: {
    apiKey: process.env.OPENAI_API_KEY,
    organizationId: process.env.OPENAI_ORG_ID, // optional
  },
  modelConfig: {
    chatModel: "gpt-4",
    maxTokens: 150,
  },
}
```

### Anthropic Setup

```typescript
ai: {
  provider: "anthropic",
  model: "summary", // no embeddings
  field: "aiSummary",
  credentials: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  modelConfig: {
    chatModel: "claude-3-sonnet-20240229",
    maxTokens: 150,
  },
}
```

## Error Handling

```typescript
advanced: {
  continueOnError: true,  // Save document even if AI fails
  maxRetries: 3,          // Retry failed requests
  timeout: 30000,         // 30 second timeout
  logLevel: "warn",       // Show warnings and errors
}
```

## Cost Optimization

### Use Cheaper Models

```typescript
modelConfig: {
  chatModel: "gpt-4o-mini", // 10x cheaper than gpt-4
  maxTokens: 100,           // Shorter responses
  temperature: 0.1,         // More consistent
}
```

### Process Selectively

```typescript
// Only process important documents
schema.pre("save", function (next) {
  if (this.status !== "published") {
    this.skipAI = true; // Custom flag
  }
  next();
});
```

## Environment Variables

```bash
# Required (choose one or both)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional
OPENAI_ORG_ID=org-...
MONGODB_URI=mongodb://localhost:27017/myapp
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

### Development vs Production

```typescript
const getConfig = () => {
  if (process.env.NODE_ENV === "development") {
    return {
      modelConfig: { chatModel: "gpt-4" },
      advanced: { logLevel: "debug" },
    };
  }

  // Production - cheaper and faster
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

### Conditional Features

```typescript
const useAI = process.env.ENABLE_AI === "true";

if (useAI) {
  schema.plugin(aiPlugin, { ai: config });
}
```

## Troubleshooting

**Functions not working?**

- Make sure `enableFunctions: true`
- Check `logLevel: "debug"` to see function calls

**API errors?**

- Verify API key format with `validateApiKey()`
- Check rate limits and quotas

**No AI content?**

- Ensure documents have enough content (>20 chars)
- Check `includeFields` and `excludeFields`

## Next Steps

- [Function Calling](function-calling.md) - Auto-classification
- [Performance](performance.md) - Speed and costs
- [API Reference](api-reference.md) - All methods
