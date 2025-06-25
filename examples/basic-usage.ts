/**
 * Basic Usage Example - mongoose-ai
 * Simple examples to get started quickly
 */

import mongoose from "mongoose";
import { aiPlugin } from "mongoose-ai";

// Set up environment
require("dotenv").config();

/**
 * Example 1: Auto-Summarization
 * Automatically generate summaries when saving documents
 */

// Define your regular Mongoose schema
const articleSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
});

// Add AI summarization - that's it!
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

/**
 * Example 2: Semantic Search
 * Search your documents using natural language
 */

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  price: Number,
});

// Add semantic search capabilities
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

/**
 * Usage Examples
 */
async function main() {
  // Connect to MongoDB
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/test"
  );

  // Example 1: Create article with auto-summary
  console.log("📝 Creating article...");

  const article = new Article({
    title: "Introduction to Machine Learning",
    content:
      "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed. It involves algorithms that can identify patterns in data and make predictions or decisions based on those patterns.",
    author: "John Smith",
  });

  await article.save(); // Summary is automatically generated!

  console.log("✨ Article created with AI summary:");
  console.log(`Title: ${article.title}`);
  console.log(`Summary: ${article.aiSummary.summary}`);
  console.log(`Generated at: ${article.aiSummary.generatedAt}`);

  // Example 2: Create products and search
  console.log("\n🛍️ Creating products...");

  const products = [
    {
      name: "iPhone 15 Pro",
      description: "Latest smartphone with advanced camera and A17 Pro chip",
      category: "Electronics",
      price: 999,
    },
    {
      name: "MacBook Air M2",
      description:
        "Lightweight laptop perfect for everyday computing and creative work",
      category: "Computers",
      price: 1199,
    },
    {
      name: "AirPods Pro",
      description: "Wireless earbuds with noise cancellation and spatial audio",
      category: "Audio",
      price: 249,
    },
  ];

  // Save products (embeddings generated automatically)
  for (const productData of products) {
    const product = new Product(productData);
    await product.save();
    console.log(`✅ Created: ${product.name}`);
  }

  // Search using natural language
  console.log("\n🔍 Searching products...");

  const searchQueries = [
    "phone with good camera",
    "laptop for creative work",
    "wireless headphones",
  ];

  for (const query of searchQueries) {
    const results = await Product.semanticSearch(query, { limit: 2 });

    console.log(`\nSearch: "${query}"`);
    results.forEach((result, i) => {
      console.log(
        `  ${i + 1}. ${result.document.name} - $${result.document.price}`
      );
      console.log(`     Similarity: ${(result.similarity * 100).toFixed(1)}%`);
    });
  }

  // Example 3: Manual operations
  console.log("\n🔧 Manual operations...");

  // Get AI content
  const firstArticle = await Article.findOne();
  const summary = firstArticle.getAIContent();
  console.log(`Current summary: ${summary.summary}`);

  // Regenerate AI content
  await firstArticle.regenerateAI();
  console.log(`New summary: ${firstArticle.getAIContent().summary}`);

  // Calculate similarity between products
  const [product1, product2] = await Product.find().limit(2);
  if (product1.calculateSimilarity) {
    const similarity = product1.calculateSimilarity(product2);
    console.log(
      `Similarity between products: ${(similarity * 100).toFixed(1)}%`
    );
  }

  // Close connection
  await mongoose.connection.close();
  console.log("\n✅ Done!");
}

// Handle errors gracefully
main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});

/**
 * Quick Start Checklist:
 *
 * 1. Install: npm install mongoose-ai
 * 2. Set environment variable: OPENAI_API_KEY=your_key_here
 * 3. Add plugin to your schema
 * 4. Use model: 'summary' for text summaries
 * 5. Use model: 'embedding' for semantic search
 * 6. Save documents normally - AI processing happens automatically!
 */

export { Article, Product };
