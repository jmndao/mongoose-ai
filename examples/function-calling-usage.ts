/**
 * Function Calling Usage Examples for mongoose-ai v1.1.0
 * Demonstrates universal function calling with both OpenAI and Anthropic
 */

import mongoose from "mongoose";
import {
  aiPlugin,
  createAdvancedAIConfig,
  QuickFunctions,
  createFunction,
  estimateCost,
  checkEnvironment,
  AIDocument,
  AIModelType,
  SummaryResult,
  AIProvider,
} from "../src/index.js";

// Environment validation
const envCheck = checkEnvironment();
if (!envCheck.isValid) {
  console.error("Environment setup required:", envCheck.missing);
  process.exit(1);
}

/**
 * Example 1: Product Review with Auto-Classification
 */
interface IProductReview {
  productName: string;
  reviewText: string;
  reviewerName: string;
  
  // AI will populate these fields via functions
  sentiment?: "positive" | "negative" | "neutral";
  rating?: number;
  category?: string;
  tags?: string[];
  aiSummary?: SummaryResult;
}

const reviewSchema = new mongoose.Schema<IProductReview>({
  productName: { type: String, required: true },
  reviewText: { type: String, required: true },
  reviewerName: { type: String, required: true },
  sentiment: { 
    type: String, 
    enum: ["positive", "negative", "neutral"] 
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5 
  },
  category: String,
  tags: [String],
});

// Add AI with function calling
reviewSchema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY!,
    provider: "openai",
    model: "summary",
    field: "aiSummary",
    prompt: "Analyze this product review and provide a summary. Use available functions to classify the review.",
    includeFields: ["productName", "reviewText"],
    excludeFields: ["reviewerName"],
    advanced: {
      enableFunctions: true,
      logLevel: "info",
    },
    functions: [
      QuickFunctions.updateField("sentiment", ["positive", "negative", "neutral"]),
      QuickFunctions.scoreField("rating", 1, 5),
      QuickFunctions.updateField("category", ["electronics", "clothing", "books", "home", "sports"]),
      QuickFunctions.manageTags("tags"),
    ],
  }),
});

const ProductReview = mongoose.model<AIDocument<IProductReview>>(
  "ProductReview", 
  reviewSchema
) as AIModelType<IProductReview>;

/**
 * Example 2: Support Ticket with Priority Classification
 */
interface ISupportTicket {
  subject: string;
  description: string;
  customerEmail: string;
  
  // AI will populate these via functions
  priority?: "low" | "medium" | "high" | "urgent";
  category?: string;
  estimatedResolutionTime?: number;
  assignedTeam?: string;
  aiSummary?: SummaryResult;
}

const ticketSchema = new mongoose.Schema<ISupportTicket>({
  subject: { type: String, required: true },
  description: { type: String, required: true },
  customerEmail: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high", "urgent"] 
  },
  category: String,
  estimatedResolutionTime: Number,
  assignedTeam: String,
});

ticketSchema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY!,
    provider: "openai",
    model: "summary",
    field: "aiSummary",
    prompt: "Analyze this support ticket and provide a summary. Classify the issue and set appropriate priority.",
    includeFields: ["subject", "description"],
    excludeFields: ["customerEmail"],
    advanced: {
      enableFunctions: true,
    },
    functions: [
      QuickFunctions.updateField("priority", ["low", "medium", "high", "urgent"]),
      QuickFunctions.updateField("category", [
        "technical", "billing", "account", "feature-request", "bug-report"
      ]),
      QuickFunctions.updateField("assignedTeam", [
        "frontend", "backend", "devops", "billing", "support"
      ]),
      
      // Custom function for time estimation
      createFunction(
        "estimate_resolution",
        "Estimate resolution time based on issue complexity",
        {
          hours: {
            type: "number",
            description: "Estimated hours to resolve (1-72)",
            required: true,
          },
        },
        async (args: any, document: any) => {
          document.estimatedResolutionTime = args.hours;
        }
      ),
    ],
  }),
});

const SupportTicket = mongoose.model<AIDocument<ISupportTicket>>(
  "SupportTicket",
  ticketSchema
) as AIModelType<ISupportTicket>;

/**
 * Example 3: Anthropic Provider Usage
 */
const anthropicTicketSchema = new mongoose.Schema<ISupportTicket>({
  subject: { type: String, required: true },
  description: { type: String, required: true },
  customerEmail: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high", "urgent"] 
  },
  category: String,
});

if (process.env.ANTHROPIC_API_KEY) {
  anthropicTicketSchema.plugin(aiPlugin, {
    ai: createAdvancedAIConfig({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      provider: "anthropic",
      model: "summary",
      field: "aiSummary",
      prompt: "Analyze this support ticket and classify it appropriately.",
      includeFields: ["subject", "description"],
      advanced: {
        enableFunctions: true,
      },
      functions: [
        QuickFunctions.updateField("priority", ["low", "medium", "high", "urgent"]),
        QuickFunctions.updateField("category", ["technical", "billing", "account"]),
      ],
    }),
  });
}

const AnthropicSupportTicket = mongoose.model<AIDocument<ISupportTicket>>(
  "AnthropicSupportTicket",
  anthropicTicketSchema
) as AIModelType<ISupportTicket>;

/**
 * Demo Functions
 */
async function createProductReviews() {
  console.log("Creating Product Reviews with Function Calling");

  const reviews = [
    {
      productName: "MacBook Pro 16-inch",
      reviewText: "Amazing laptop! The M2 Pro chip is incredibly fast for development work. Battery life is excellent. The display is gorgeous and build quality is top-notch. Only downside is the price.",
      reviewerName: "DevExpert2023",
    },
    {
      productName: "Budget Wireless Headphones",
      reviewText: "Terrible sound quality. Very uncomfortable after 30 minutes. Connection keeps dropping. Save your money.",
      reviewerName: "AudioCritic",
    },
  ];

  for (const reviewData of reviews) {
    console.log(`\nProcessing review: ${reviewData.productName}`);
    
    const review = new ProductReview(reviewData);
    await review.save();
    
    console.log(`Summary: ${review.aiSummary?.summary}`);
    console.log(`Sentiment: ${review.sentiment}`);
    console.log(`Rating: ${review.rating}/5`);
    console.log(`Category: ${review.category}`);
    console.log(`Tags: ${review.tags?.join(", ") || "none"}`);

    if (review.aiSummary?.functionResults) {
      console.log(`Functions executed: ${review.aiSummary.functionResults.length}`);
    }
  }
}

async function createSupportTickets() {
  console.log("\nCreating Support Tickets with Function Calling");

  const tickets = [
    {
      subject: "Website completely down - urgent!",
      description: "Our entire website has been down for 2 hours. Customers can't access anything. This is costing us thousands in lost revenue. Need immediate help!",
      customerEmail: "ceo@bigcompany.com",
    },
    {
      subject: "How to change password?",
      description: "I forgot my password and can't figure out how to reset it. The reset link doesn't seem to work.",
      customerEmail: "user@example.com",
    },
  ];

  for (const ticketData of tickets) {
    console.log(`\nProcessing ticket: ${ticketData.subject}`);
    
    const ticket = new SupportTicket(ticketData);
    await ticket.save();
    
    console.log(`Summary: ${ticket.aiSummary?.summary}`);
    console.log(`Priority: ${ticket.priority}`);
    console.log(`Category: ${ticket.category}`);
    console.log(`Assigned Team: ${ticket.assignedTeam}`);
    console.log(`Est. Resolution: ${ticket.estimatedResolutionTime} hours`);
  }
}

async function demonstrateProviderComparison() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("\nAnthropic provider not available (missing API key)");
    return;
  }

  console.log("\nComparing OpenAI vs Anthropic Function Calling");

  const sampleTicket = {
    subject: "API rate limit exceeded",
    description: "Getting 429 errors when calling the API. Need to increase rate limits for production usage.",
    customerEmail: "dev@company.com",
  };

  // Test with OpenAI
  console.log("\nOpenAI Provider:");
  const openaiTicket = new SupportTicket(sampleTicket);
  await openaiTicket.save();
  console.log(`Priority: ${openaiTicket.priority}`);
  console.log(`Category: ${openaiTicket.category}`);

  // Test with Anthropic
  console.log("\nAnthropic Provider:");
  const anthropicTicket = new AnthropicSupportTicket(sampleTicket);
  await anthropicTicket.save();
  console.log(`Priority: ${anthropicTicket.priority}`);
  console.log(`Category: ${anthropicTicket.category}`);
}

async function demonstrateBackwardCompatibility() {
  console.log("\nDemonstrating Backward Compatibility");
  
  // Create a schema without function calling (v1.0.x style)
  const legacySchema = new mongoose.Schema({
    title: String,
    content: String,
  });

  legacySchema.plugin(aiPlugin, {
    ai: {
      model: "summary",
      provider: "openai",
      field: "aiSummary",
      credentials: { apiKey: process.env.OPENAI_API_KEY! },
      prompt: "Summarize this content:",
    },
  });

  const LegacyModel = mongoose.model("LegacyModel", legacySchema);

  const doc = new LegacyModel({
    title: "Test Document",
    content: "This is a test document to verify backward compatibility.",
  });

  await doc.save();
  console.log(`Legacy summary: ${(doc as any).aiSummary?.summary}`);
  console.log("Backward compatibility confirmed - no functions executed");
}

/**
 * Main demonstration
 */
async function runFunctionCallingDemo() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/mongoose-ai-functions"
    );
    console.log("Connected to MongoDB");

    // Clear existing data
    await ProductReview.deleteMany({});
    await SupportTicket.deleteMany({});
    if (process.env.ANTHROPIC_API_KEY) {
      await AnthropicSupportTicket.deleteMany({});
    }

    // Run examples
    await createProductReviews();
    await createSupportTickets();
    await demonstrateProviderComparison();
    await demonstrateBackwardCompatibility();

    console.log("\nFunction calling demo completed successfully!");
  } catch (error) {
    console.error("Demo failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Export for use in other files
export {
  ProductReview,
  SupportTicket,
  AnthropicSupportTicket,
  runFunctionCallingDemo,
  createProductReviews,
  createSupportTickets,
  demonstrateProviderComparison,
  demonstrateBackwardCompatibility,
};

// Run demo if executed directly
if (require.main === module) {
  runFunctionCallingDemo().catch(console.error);
}