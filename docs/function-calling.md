# Function Calling

Let AI automatically fill document fields based on content.

## What It Does

Instead of just creating summaries, AI can:

- Set sentiment (positive/negative/neutral)
- Give ratings (1-5 stars)
- Add tags automatically
- Update any field you want

## Basic Setup

```typescript
import {
  aiPlugin,
  createAdvancedAIConfig,
  QuickFunctions,
} from "@jmndao/mongoose-ai";

const reviewSchema = new mongoose.Schema({
  productName: String,
  reviewText: String,
  // AI will fill these
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
      enableFunctions: true, // Turn on function calling
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
```

## Quick Functions

### Update Field

```typescript
// Set a field to one of several values
QuickFunctions.updateField("status", ["active", "pending", "completed"]);
QuickFunctions.updateField("category", ["tech", "business", "personal"]);
```

### Score Field

```typescript
// Give a numeric score
QuickFunctions.scoreField("rating", 1, 5); // 1-5 stars
QuickFunctions.scoreField("quality", 1, 10); // 1-10 quality
QuickFunctions.scoreField("urgency", 0, 100); // 0-100 urgency
```

### Manage Tags

```typescript
// Handle arrays of tags
QuickFunctions.manageTags("tags"); // Default field name
QuickFunctions.manageTags("categories"); // Custom field name
```

## Custom Functions

```typescript
import { createFunction } from "@jmndao/mongoose-ai";

const urgencyFunction = createFunction(
  "set_urgency",
  "Set urgency level and escalation",
  {
    urgency: {
      type: "number",
      description: "Urgency from 1-10",
      required: true,
    },
    escalate: {
      type: "boolean",
      description: "Need escalation?",
      required: true,
    },
  },
  async (args, document) => {
    document.urgency = args.urgency;
    document.needsEscalation = args.escalate;
  }
);

// Use in your schema
functions: [urgencyFunction];
```

## Real Examples

### Product Reviews

```typescript
const reviewSchema = new mongoose.Schema({
  productId: String,
  reviewText: String,
  sentiment: String,
  rating: Number,
  aspects: [String], // What they liked/disliked
});

reviewSchema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY,
    provider: "openai",
    model: "summary",
    field: "aiSummary",
    prompt:
      "Analyze this product review. Rate it 1-5, find the sentiment, and list key aspects mentioned.",
    advanced: { enableFunctions: true },
    functions: [
      QuickFunctions.updateField("sentiment", [
        "positive",
        "negative",
        "neutral",
      ]),
      QuickFunctions.scoreField("rating", 1, 5),
      QuickFunctions.manageTags("aspects"),
    ],
  }),
});

// AI automatically fills sentiment, rating, and aspects
```

### Content Moderation

```typescript
const postSchema = new mongoose.Schema({
  content: String,
  toxicityScore: Number,
  action: String,
  needsReview: Boolean,
});

postSchema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    // ... config
    functions: [
      QuickFunctions.scoreField("toxicityScore", 0, 100),
      QuickFunctions.updateField("action", ["approve", "flag", "block"]),
      createFunction(
        "review_decision",
        "Decide if needs human review",
        {
          needs_review: {
            type: "boolean",
            description: "Needs human review?",
            required: true,
          },
        },
        async (args, document) => {
          document.needsReview = args.needs_review;
        }
      ),
    ],
  }),
});
```

### Customer Support

```typescript
const ticketSchema = new mongoose.Schema({
  description: String,
  urgency: String,
  category: String,
  estimatedHours: Number,
});

ticketSchema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    // ... config
    prompt:
      "Analyze this support ticket. Classify urgency, category, and estimate resolution time.",
    functions: [
      QuickFunctions.updateField("urgency", [
        "low",
        "medium",
        "high",
        "critical",
      ]),
      QuickFunctions.updateField("category", [
        "technical",
        "billing",
        "account",
      ]),
      QuickFunctions.scoreField("estimatedHours", 1, 24),
    ],
  }),
});
```

## How It Works

1. You save a document
2. AI reads the content
3. AI decides what functions to call
4. Functions update document fields
5. Document is saved with AI data

## Debug Function Calls

```typescript
// See what functions are called
advanced: {
  logLevel: "debug", // Shows function calls
}
```

Output:

```
[DEBUG] Executing 3 function calls
[DEBUG] Function update_sentiment: SUCCESS
[DEBUG] Function score_rating: SUCCESS
[DEBUG] Function manage_tags: SUCCESS
```

## Costs

Function calling uses more tokens:

- Basic: ~280 tokens per document
- With functions: ~926 tokens per document (3x more)

But it saves manual work. See [Performance](performance.md) for details.

## Tips

1. **Write clear prompts**: Tell AI what to do
2. **Use descriptive function names**: `analyze_sentiment` not `func1`
3. **Test with debug logging**: See what functions are called
4. **Start simple**: Try one function first

## Next Steps

- [Configuration](configuration.md) - More options
- [Performance](performance.md) - Costs and speed
- [Examples](annexes/usage-examples.md) - Real use cases
