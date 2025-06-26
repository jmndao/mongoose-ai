/**
 * Database Scaling Test Script
 * Tests mongoose-ai performance with increasing database sizes
 */

import mongoose from "mongoose";
import { aiPlugin, createAIConfig } from "../src/index.js";

// Test schema
const testSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String,
});

testSchema.plugin(aiPlugin, {
  ai: createAIConfig({
    apiKey: process.env.OPENAI_API_KEY!,
    model: "embedding",
    field: "searchEmbedding",
  }),
});

const TestDoc = mongoose.model("TestDoc", testSchema);

class ScalingTest {
  async generateTestData(count: number) {
    console.log(`\nGenerating ${count} test documents...`);

    const categories = ["Tech", "Science", "Business", "Health", "Education"];
    const docs = [];

    for (let i = 0; i < count; i++) {
      docs.push({
        title: `Test Document ${i + 1}`,
        content: `This is test content for document ${
          i + 1
        }. It contains various keywords and topics related to ${
          categories[i % categories.length]
        }. The content is designed to test search performance and AI processing capabilities at scale.`,
        category: categories[i % categories.length],
      });

      if ((i + 1) % 100 === 0) {
        console.log(`  Generated ${i + 1}/${count} documents`);
      }
    }

    // Insert in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      await TestDoc.insertMany(batch);
      console.log(
        `  Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          docs.length / batchSize
        )}`
      );
    }

    console.log(`Generated ${count} test documents`);
  }

  async processWithAI(count: number) {
    console.log(`\nProcessing ${count} documents with AI...`);

    const startTime = Date.now();
    let processed = 0;

    const docs = await TestDoc.find({
      searchEmbedding: { $exists: false },
    }).limit(count);

    for (const doc of docs) {
      const docStartTime = Date.now();

      // Trigger AI processing
      doc.content = doc.content + " (updated)";
      await doc.save();

      processed++;
      const docTime = Date.now() - docStartTime;

      if (processed % 10 === 0) {
        console.log(
          `  Processed ${processed}/${count} - Last doc: ${docTime}ms`
        );
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`Processed ${processed} documents in ${totalTime}ms`);
    console.log(
      `   Average: ${(totalTime / processed).toFixed(2)}ms per document`
    );
    console.log(
      `   Throughput: ${((processed / totalTime) * 60000).toFixed(
        1
      )} docs/minute`
    );
  }

  async testSearchPerformance() {
    console.log(`\nTesting search performance...`);

    const dbSize = await TestDoc.countDocuments();
    const embeddingCount = await TestDoc.countDocuments({
      searchEmbedding: { $exists: true },
    });

    console.log(`Database stats:`);
    console.log(`   Total documents: ${dbSize.toLocaleString()}`);
    console.log(`   With embeddings: ${embeddingCount.toLocaleString()}`);

    const searchQueries = [
      "technology innovation",
      "scientific research",
      "business strategy",
      "health technology",
      "educational methods",
    ];

    for (const query of searchQueries) {
      const startTime = Date.now();

      try {
        const results = await TestDoc.semanticSearch(query, {
          limit: 5,
          threshold: 0.5,
        });

        const searchTime = Date.now() - startTime;

        console.log(`\n   Query: "${query}"`);
        console.log(`   Time: ${searchTime}ms`);
        console.log(`   Results: ${results.length}`);

        if (searchTime > 5000) {
          console.log(`   Warning: Search taking too long (${searchTime}ms)`);
        } else if (searchTime > 1000) {
          console.log(
            `   Warning: Search performance degrading (${searchTime}ms)`
          );
        } else {
          console.log(`   Good performance (${searchTime}ms)`);
        }
      } catch (error) {
        console.log(`   Search failed: ${error}`);
      }
    }
  }

  async testMemoryUsage() {
    console.log(`\nMemory usage analysis...`);

    const beforeMemory = process.memoryUsage();

    // Load a subset of documents
    const docs = await TestDoc.find().limit(1000);

    const afterMemory = process.memoryUsage();

    console.log(`Memory usage:`);
    console.log(
      `   Before: ${(beforeMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(
      `   After: ${(afterMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(
      `   Difference: ${(
        (afterMemory.heapUsed - beforeMemory.heapUsed) /
        1024 /
        1024
      ).toFixed(2)} MB`
    );
    console.log(
      `   Per document: ${(
        (afterMemory.heapUsed - beforeMemory.heapUsed) /
        docs.length /
        1024
      ).toFixed(2)} KB`
    );
  }

  async runScalingTest() {
    console.log("DATABASE SCALING TEST");
    console.log("=".repeat(50));

    const testSizes = [100, 500, 1000, 2000];

    for (const size of testSizes) {
      console.log(`\nTesting with ${size} documents`);
      console.log("-".repeat(30));

      // Clear existing data
      await TestDoc.deleteMany({});

      // Generate test data (without AI processing)
      await this.generateTestData(size);

      // Test AI processing performance
      await this.processWithAI(Math.min(size, 50)); // Process subset with AI

      // Test search performance
      await this.testSearchPerformance();

      // Test memory usage
      await this.testMemoryUsage();

      console.log(`\nCompleted test with ${size} documents`);
    }

    this.generateRecommendations();
  }

  generateRecommendations() {
    console.log("\nSCALING RECOMMENDATIONS");
    console.log("=".repeat(50));
    console.log("Based on the test results:");
    console.log("");
    console.log("Performance Thresholds:");
    console.log("   • < 1,000 docs: mongoose-ai works great as-is");
    console.log("   • 1,000-10,000 docs: Consider search result caching");
    console.log("   • 10,000-100,000 docs: Implement pagination and indexes");
    console.log("   • 100,000+ docs: Migrate to vector database solution");
    console.log("");
    console.log("Optimization Strategies:");
    console.log("   • Add database indexes for frequent search patterns");
    console.log("   • Implement result caching for common queries");
    console.log("   • Use background processing for AI generation");
    console.log("   • Consider MongoDB Atlas Vector Search");
    console.log("   • Implement read replicas for search operations");
    console.log("");
    console.log("Next Steps:");
    console.log("   • Monitor search performance in production");
    console.log("   • Set up alerting for slow queries (>1s)");
    console.log("   • Plan migration strategy before hitting limits");
    console.log("   • Consider vector database integration");
  }
}

async function runScalingTests() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY required");
    process.exit(1);
  }

  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/mongoose-ai-scaling"
    );
    console.log("Connected to MongoDB");

    const test = new ScalingTest();
    await test.runScalingTest();
  } catch (error) {
    console.error("Scaling test failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nScaling test complete!");
  }
}

// Export for use
export { ScalingTest };

// Run if executed directly
if (require.main === module) {
  runScalingTests().catch(console.error);
}
