/**
 * Ollama (Local LLM) Usage Example
 * Demonstrates local AI processing with Ollama
 */

import mongoose from "mongoose";
import {
  aiPlugin,
  createOllamaConfig,
  createAdvancedAIConfig,
  QuickFunctions,
} from "../src/index.js";

// Set up environment
require("dotenv").config();

// Define schemas for different use cases
const articleSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String,
});

const reviewSchema = new mongoose.Schema({
  productName: String,
  reviewText: String,
  sentiment: String,
  rating: Number,
  tags: [String],
});

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  price: Number,
});

// Configure different Ollama setups

// 1. Basic Ollama summarization
articleSchema.plugin(aiPlugin, {
  ai: createOllamaConfig({
    model: "summary",
    field: "aiSummary",
    chatModel: "llama3.2", // or "llama2", "mistral", etc.
    endpoint: "http://localhost:11434", // default Ollama endpoint
  }),
});

// 2. Ollama with function calling
reviewSchema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: "local",
    provider: "ollama",
    model: "summary",
    field: "aiSummary",
    advanced: {
      enableFunctions: true,
      logLevel: "info",
    },
    modelConfig: {
      chatModel: "llama3.2",
      endpoint: "http://localhost:11434",
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

// 3. Ollama embeddings for semantic search
productSchema.plugin(aiPlugin, {
  ai: createOllamaConfig({
    model: "embedding",
    field: "aiEmbedding",
    embeddingModel: "nomic-embed-text", // Popular Ollama embedding model
    endpoint: "http://localhost:11434",
  }),
});

// Create models
const Article = mongoose.model("Article", articleSchema);
const Review = mongoose.model("Review", reviewSchema);
const Product = mongoose.model("Product", productSchema);

async function demonstrateOllama() {
  try {
    console.log("mongoose-ai + Ollama Demo");
    console.log("========================");
    console.log("Requirements:");
    console.log("1. Ollama installed and running");
    console.log(
      "2. Models downloaded: ollama pull llama3.2 && ollama pull nomic-embed-text"
    );
    console.log("");

    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/mongoose-ai-ollama";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Clear existing data
    await Article.deleteMany({});
    await Review.deleteMany({});
    await Product.deleteMany({});

    // Test 1: Basic Summarization
    console.log("\n1. BASIC SUMMARIZATION");
    console.log("-".repeat(40));

    const article = new Article({
      title: "Local AI Revolution",
      content:
        "Local large language models are transforming how we think about AI deployment. With tools like Ollama, developers can run sophisticated AI models on their own hardware without relying on external APIs. This approach offers benefits including data privacy, cost control, and offline capability. However, it also requires more computational resources and technical expertise.",
      category: "technology",
    });

    console.log("Creating article with Ollama summarization...");
    const startTime = Date.now();
    await article.save();
    const processingTime = Date.now() - startTime;

    console.log(`✅ Article processed in ${processingTime}ms`);
    console.log(`Title: ${article.title}`);
    console.log(`Summary: ${article.aiSummary?.summary}`);
    console.log(`Model: ${article.aiSummary?.model}`);
    console.log(`Local processing: $0.00 cost`);

    // Test 2: Function Calling
    console.log("\n2. FUNCTION CALLING (AUTO-CLASSIFICATION)");
    console.log("-".repeat(40));

    const reviews = [
      {
        productName: "Local LLM Setup",
        reviewText:
          "Amazing! Finally can run AI without internet. Setup was complex but worth it.",
      },
      {
        productName: "Ollama Installation",
        reviewText:
          "Terrible experience. Too slow on my laptop and crashes frequently.",
      },
    ];

    for (const reviewData of reviews) {
      console.log(`\nProcessing review: "${reviewData.productName}"`);
      const startTime = Date.now();

      const review = new Review(reviewData);
      await review.save();

      const processingTime = Date.now() - startTime;

      console.log(`✅ Review processed in ${processingTime}ms`);
      console.log(`Sentiment: ${review.sentiment}`);
      console.log(`Rating: ${review.rating}/5`);
      console.log(`Tags: ${review.tags?.join(", ") || "none"}`);
      console.log(
        `Functions executed: ${review.aiSummary?.functionResults?.length || 0}`
      );
    }

    // Test 3: Semantic Search
    console.log("\n3. SEMANTIC SEARCH");
    console.log("-".repeat(40));

    console.log("Creating products with embeddings...");
    const products = await Product.create([
      {
        name: "Gaming Laptop",
        description: "High-performance laptop for gaming and AI development",
        category: "computers",
        price: 1500,
      },
      {
        name: "AI Development Server",
        description: "Powerful server optimized for machine learning workloads",
        category: "computers",
        price: 3000,
      },
      {
        name: "Wireless Headphones",
        description: "Premium audio quality for music and calls",
        category: "audio",
        price: 200,
      },
    ]);

    console.log(`✅ Created ${products.length} products with embeddings`);

    // Wait for embeddings to be processed
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Perform semantic search
    const searchQueries = [
      "computer for AI development",
      "audio equipment",
      "gaming hardware",
    ];

    for (const query of searchQueries) {
      try {
        console.log(`\nSearching: "${query}"`);
        const startTime = Date.now();

        const results = await Product.semanticSearch(query, {
          limit: 2,
          threshold: 0.3,
        });

        const searchTime = Date.now() - startTime;

        console.log(`Search completed in ${searchTime}ms`);
        if (results.length === 0) {
          console.log("No results found");
        } else {
          results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.document.name}`);
            console.log(
              `   Similarity: ${(result.similarity * 100).toFixed(1)}%`
            );
            console.log(`   Price: $${result.document.price}`);
          });
        }
      } catch (error) {
        console.log(`Search failed: ${error.message}`);
      }
    }

    // Performance comparison
    console.log("\n4. PERFORMANCE SUMMARY");
    console.log("-".repeat(40));
    console.log("✅ Zero API costs (local processing)");
    console.log("✅ Complete data privacy");
    console.log("✅ Offline capability");
    console.log("✅ No rate limits");
    console.log("⚠️  Requires local setup and resources");
    console.log("⚠️  Performance varies by hardware");

    // Configuration examples
    console.log("\n5. CONFIGURATION OPTIONS");
    console.log("-".repeat(40));

    console.log("\nAvailable Ollama models:");
    console.log("- Chat: llama3.2, llama2, mistral, codellama, phi3");
    console.log("- Embeddings: nomic-embed-text, all-minilm");

    console.log("\nCustom endpoint example:");
    console.log(`
createOllamaConfig({
  model: "summary",
  field: "aiSummary", 
  endpoint: "http://192.168.1.100:11434", // Remote Ollama server
  chatModel: "mistral",
})`);
  } catch (error) {
    console.error("Demo failed:", error);

    if (error.message.includes("fetch")) {
      console.log("\n❌ Cannot connect to Ollama");
      console.log("Setup instructions:");
      console.log("1. Install Ollama: https://ollama.ai");
      console.log("2. Start Ollama: ollama serve");
      console.log("3. Download models:");
      console.log("   ollama pull llama3.2");
      console.log("   ollama pull nomic-embed-text");
      console.log("4. Run this example again");
    }
  } finally {
    await mongoose.connection.close();
    console.log("\nDemo complete!");
  }
}

// Model comparison helper
function showModelComparison() {
  console.log("\nPROVIDER COMPARISON");
  console.log("=".repeat(50));

  const comparison = [
    {
      provider: "OpenAI",
      cost: "$1.50/1M tokens",
      setup: "API key only",
      privacy: "Data sent to OpenAI",
      performance: "Excellent",
      offline: "No",
    },
    {
      provider: "Anthropic",
      cost: "$0.25/1M tokens",
      setup: "API key only",
      privacy: "Data sent to Anthropic",
      performance: "Excellent",
      offline: "No",
    },
    {
      provider: "Ollama",
      cost: "$0.00",
      setup: "Local installation",
      privacy: "100% local",
      performance: "Hardware dependent",
      offline: "Yes",
    },
  ];

  console.log(
    "\nProvider  | Cost        | Setup           | Privacy           | Performance | Offline"
  );
  console.log("-".repeat(80));
  comparison.forEach((item) => {
    console.log(
      `${item.provider.padEnd(9)} | ${item.cost.padEnd(
        11
      )} | ${item.setup.padEnd(15)} | ${item.privacy.padEnd(
        17
      )} | ${item.performance.padEnd(11)} | ${item.offline}`
    );
  });
}

// Usage scenarios
function showUsageScenarios() {
  console.log("\nUSE CASES FOR OLLAMA");
  console.log("=".repeat(50));

  const scenarios = [
    "🏥 Healthcare: Patient data privacy requirements",
    "🏛️  Government: Classified or sensitive documents",
    "💰 Startups: Cost optimization for high-volume processing",
    "🔬 Research: Offline environments or air-gapped systems",
    "🏢 Enterprise: Internal data processing policies",
    "🌍 Global: Regulatory compliance (GDPR, data sovereignty)",
    "📱 Edge: IoT or embedded AI applications",
    "🎓 Education: Learning AI without ongoing costs",
  ];

  scenarios.forEach((scenario) => console.log(scenario));
}

// Setup guide
function showSetupGuide() {
  console.log("\nQUICK SETUP GUIDE");
  console.log("=".repeat(50));

  console.log(`
1. Install Ollama:
   • macOS: brew install ollama
   • Linux: curl -fsSL https://ollama.ai/install.sh | sh
   • Windows: Download from https://ollama.ai

2. Start Ollama:
   ollama serve

3. Download models:
   ollama pull llama3.2          # For summaries
   ollama pull nomic-embed-text  # For embeddings

4. Use in mongoose-ai:
   import { createOllamaConfig } from "@jmndao/mongoose-ai";
   
   schema.plugin(aiPlugin, {
     ai: createOllamaConfig({
       model: "summary",
       field: "aiSummary",
     })
   });

5. Run your application - no API keys needed!
`);
}

// Handle script execution
async function main() {
  console.clear();
  await demonstrateOllama();
  showModelComparison();
  showUsageScenarios();
  showSetupGuide();
}

// Run demo if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { demonstrateOllama, Article, Review, Product };
