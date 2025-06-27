/**
 * Function Calling Benchmark for mongoose-ai v1.1.0 - FIXED VERSION
 * Compares basic AI processing vs function calling performance
 */

import mongoose from "mongoose";
import {
  aiPlugin,
  createAIConfig,
  createAdvancedAIConfig,
  QuickFunctions,
  estimateCost,
} from "../src/index.js";

// Basic processing schema (no functions)
const basicArticleSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String,
});

basicArticleSchema.plugin(aiPlugin, {
  ai: createAIConfig({
    apiKey: process.env.OPENAI_API_KEY!,
    model: "summary",
    field: "aiSummary",
    includeFields: ["title", "content"],
  }),
});

// Function calling schema
const smartArticleSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String,
  sentiment: String,
  priority: Number,
  tags: [String],
});

smartArticleSchema.plugin(aiPlugin, {
  ai: createAdvancedAIConfig({
    apiKey: process.env.OPENAI_API_KEY!,
    provider: "openai",
    model: "summary",
    field: "aiSummary",
    prompt: `Analyze this content and provide a summary in 2-3 sentences. 

You MUST also use ALL the available functions to:
1. Classify the sentiment as positive, negative, or neutral using update_sentiment
2. Assign a priority score from 1-5 based on importance/urgency using score_priority  
3. Add 2-3 relevant tags for categorization using manage_tags

Please use ALL the functions to classify this content properly.`,
    includeFields: ["title", "content"],
    advanced: {
      enableFunctions: true,
      logLevel: "debug", // Keep debug for now to see what's happening
      maxRetries: 1, // Reduce retries to save credits
      continueOnError: true,
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

const BasicArticle = mongoose.model("BasicArticle", basicArticleSchema);
const SmartArticle = mongoose.model("SmartArticle", smartArticleSchema);

// Test function to debug - this should now show the FIXED structure
console.log("DEBUG: QuickFunction test");
const testFunc = QuickFunctions.updateField("sentiment", [
  "positive",
  "negative",
  "neutral",
]);
console.log("Function name:", testFunc.name);
console.log("Parameters:", JSON.stringify(testFunc.parameters, null, 2));

const testData = [
  {
    title: "Breaking: Revolutionary AI Discovery",
    content:
      "Scientists announce breakthrough in artificial general intelligence research with implications for future technology development and societal transformation.",
    category: "Technology",
  },
  {
    title: "Market Analysis: Tech Stocks Decline",
    content:
      "Technology sector experiences significant downturn amid concerns about rising interest rates and regulatory challenges facing major companies.",
    category: "Finance",
  },
  {
    title: "New Study: Remote Work Benefits",
    content:
      "Comprehensive research reveals positive impacts of remote work on employee productivity, work-life balance, and company operational costs.",
    category: "Business",
  },
];

async function benchmarkBasicProcessing() {
  console.log("Basic AI Processing (Summary Only)");
  console.log("-".repeat(40));

  const startTime = Date.now();
  const results = [];

  for (let i = 0; i < testData.length; i++) {
    const docStart = Date.now();

    const article = new BasicArticle(testData[i]);
    await article.save();

    const processingTime = Date.now() - docStart;
    const tokens = article.aiSummary?.tokenCount || 0;
    const cost = estimateCost(tokens, "gpt-3.5-turbo");

    results.push({
      title: article.title,
      processingTime,
      tokens,
      cost,
      functionsExecuted: 0,
    });

    console.log(`${i + 1}. ${article.title.substring(0, 50)}...`);
    console.log(`   Time: ${processingTime}ms`);
    console.log(`   Tokens: ${tokens}`);
    console.log(
      `   Summary: ${article.aiSummary?.summary?.substring(0, 80)}...`
    );
    console.log("");
  }

  const totalTime = Date.now() - startTime;

  return {
    type: "Basic Processing",
    totalTime,
    avgTime: totalTime / testData.length,
    totalTokens: results.reduce((sum, r) => sum + r.tokens, 0),
    totalCost: results.reduce((sum, r) => sum + r.cost, 0),
    results,
  };
}

async function benchmarkFunctionCalling() {
  console.log("Function Calling Processing (Summary + Functions)");
  console.log("-".repeat(40));

  const startTime = Date.now();
  const results = [];

  for (let i = 0; i < testData.length; i++) {
    const docStart = Date.now();

    const article = new SmartArticle(testData[i]);
    await article.save();

    const processingTime = Date.now() - docStart;
    const tokens = article.aiSummary?.tokenCount || 0;
    const cost = estimateCost(tokens, "gpt-3.5-turbo");
    const functionsExecuted = article.aiSummary?.functionResults?.length || 0;

    results.push({
      title: article.title,
      processingTime,
      tokens,
      cost,
      functionsExecuted,
      sentiment: article.sentiment,
      priority: article.priority,
      tags: article.tags,
    });

    console.log(`${i + 1}. ${article.title.substring(0, 50)}...`);
    console.log(`   Time: ${processingTime}ms`);
    console.log(`   Tokens: ${tokens}`);
    console.log(`   Functions: ${functionsExecuted}`);
    console.log(`   Sentiment: ${article.sentiment}`);
    console.log(`   Priority: ${article.priority}/5`);
    console.log(`   Tags: ${article.tags?.join(", ") || "none"}`);
    console.log("");

    // Debug: Show function results if available
    if (article.aiSummary?.functionResults) {
      console.log("   Function Results:");
      article.aiSummary.functionResults.forEach(result => {
        console.log(`     - ${result.name}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        if (result.error) console.log(`       Error: ${result.error}`);
      });
    }
    console.log("");
  }

  const totalTime = Date.now() - startTime;

  return {
    type: "Function Calling",
    totalTime,
    avgTime: totalTime / testData.length,
    totalTokens: results.reduce((sum, r) => sum + r.tokens, 0),
    totalCost: results.reduce((sum, r) => sum + r.cost, 0),
    results,
  };
}

function compareResults(basicResults: any, functionResults: any) {
  console.log("PERFORMANCE COMPARISON");
  console.log("=".repeat(50));

  const timeOverhead = functionResults.avgTime - basicResults.avgTime;
  const costOverhead = functionResults.totalCost - basicResults.totalCost;
  const tokenOverhead = functionResults.totalTokens - basicResults.totalTokens;

  console.log("Basic Processing:");
  console.log(`   Avg Time: ${basicResults.avgTime.toFixed(0)}ms`);
  console.log(`   Total Tokens: ${basicResults.totalTokens}`);
  console.log(`   Total Cost: ${basicResults.totalCost.toFixed(6)}`);
  console.log(`   Features: Summary only`);

  console.log("\nFunction Calling:");
  console.log(`   Avg Time: ${functionResults.avgTime.toFixed(0)}ms`);
  console.log(`   Total Tokens: ${functionResults.totalTokens}`);
  console.log(`   Total Cost: ${functionResults.totalCost.toFixed(6)}`);
  console.log(`   Features: Summary + automated classification`);

  console.log("\nOverhead Analysis:");
  console.log(
    `   Time Overhead: +${timeOverhead.toFixed(0)}ms (${(
      (timeOverhead / basicResults.avgTime) *
      100
    ).toFixed(1)}%)`
  );
  console.log(
    `   Token Overhead: +${tokenOverhead} tokens (${(
      (tokenOverhead / basicResults.totalTokens) *
      100
    ).toFixed(1)}%)`
  );
  console.log(
    `   Cost Overhead: +${costOverhead.toFixed(6)} (${(
      (costOverhead / basicResults.totalCost) *
      100
    ).toFixed(1)}%)`
  );

  console.log("\nValue Proposition:");
  const functionsPerDoc = functionResults.results[0]?.functionsExecuted || 0;
  const manualClassificationTime = functionsPerDoc * 2; // 2 minutes per classification
  const timeSavedPerDoc = manualClassificationTime * 60 * 1000; // Convert to ms
  const efficiencyGain = timeSavedPerDoc > 0 
    ? ((timeSavedPerDoc - timeOverhead) / timeSavedPerDoc) * 100
    : 0;

  console.log(`   Functions executed per document: ${functionsPerDoc}`);
  console.log(
    `   Manual classification time saved: ${manualClassificationTime} minutes`
  );
  console.log(
    `   Efficiency gain: ${efficiencyGain.toFixed(1)}% faster than manual`
  );
  console.log(
    `   Additional value: Automated sentiment, priority, and tagging`
  );

  return {
    timeOverhead,
    costOverhead,
    tokenOverhead,
    efficiencyGain,
  };
}

async function runFunctionCallingBenchmark() {
  console.log("mongoose-ai Function Calling Benchmark - FIXED VERSION");
  console.log("=".repeat(50));

  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/mongoose-ai-benchmark"
    );
    console.log("Connected to MongoDB\n");

    // Clear existing data
    await BasicArticle.deleteMany({});
    await SmartArticle.deleteMany({});

    // Run benchmarks
    const basicResults = await benchmarkBasicProcessing();
    const functionResults = await benchmarkFunctionCalling();

    // Compare results
    const comparison = compareResults(basicResults, functionResults);

    console.log("\nKEY INSIGHTS");
    console.log("-".repeat(30));
    console.log(
      `Function calling adds ${comparison.timeOverhead.toFixed(
        0
      )}ms overhead per document`
    );
    console.log(
      `Additional cost is ${(
        (comparison.costOverhead / basicResults.totalCost) *
        100
      ).toFixed(1)}% for automated classification`
    );
    console.log(
      `Saves ${comparison.efficiencyGain.toFixed(
        1
      )}% time vs manual classification`
    );
    console.log(`Provides consistent, automated data enrichment`);

    console.log("\nRECOMMENDATIONS");
    console.log("-".repeat(30));
    console.log("Use basic processing when:");
    console.log("   - Only summaries are needed");
    console.log("   - Processing large volumes with tight budgets");
    console.log("   - Minimizing latency is critical");

    console.log("\nUse function calling when:");
    console.log("   - Automated classification is valuable");
    console.log("   - Data enrichment reduces manual work");
    console.log("   - Consistency in categorization is important");
  } catch (error) {
    console.error("Benchmark failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nBenchmark complete!");
  }
}

// Export for use in other files
export { runFunctionCallingBenchmark };

// Run benchmark if executed directly
if (require.main === module) {
  runFunctionCallingBenchmark().catch(console.error);
}