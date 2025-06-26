/**
 * Updated Usage Examples for mongoose-ai v1.0.3
 * Clean, simple, and properly typed implementation patterns
 */

import mongoose from "mongoose";
import {
  aiPlugin,
  createAIConfig,
  estimateCost,
  checkEnvironment,
  AIDocument,
  AIModelType,
  SummaryResult,
  EmbeddingResult,
} from "../src/index.js";

// Environment validation
const envCheck = checkEnvironment();
if (!envCheck.isValid) {
  console.error("Environment setup required:", envCheck.missing);
  process.exit(1);
}

/**
 * Example 1: Blog with AI Summarization
 */
interface IBlogPost {
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  publishedAt: Date;
  aiSummary?: SummaryResult;
}

const blogSchema = new mongoose.Schema<IBlogPost>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  category: String,
  tags: [String],
  publishedAt: { type: Date, default: Date.now },
});

// Add AI summarization
blogSchema.plugin(aiPlugin, {
  ai: createAIConfig({
    apiKey: process.env.OPENAI_API_KEY!,
    model: "summary",
    field: "aiSummary",
    prompt: "Create an engaging summary highlighting the key insights:",
    includeFields: ["title", "content", "category"],
    excludeFields: ["author"],
    advanced: {
      maxRetries: 2,
      timeout: 30000,
      logLevel: "info",
    },
  }),
});

const BlogPost = mongoose.model<AIDocument<IBlogPost>>(
  "BlogPost",
  blogSchema
) as AIModelType<IBlogPost>;

/**
 * Example 2: Product Catalog with Semantic Search
 */
interface IProduct {
  name: string;
  description: string;
  category: string;
  price: number;
  features: string[];
  searchEmbedding?: EmbeddingResult;
}

const productSchema = new mongoose.Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  features: [String],
});

// Add semantic search capabilities
productSchema.plugin(aiPlugin, {
  ai: createAIConfig({
    apiKey: process.env.OPENAI_API_KEY!,
    model: "embedding",
    field: "searchEmbedding",
    includeFields: ["name", "description", "features"],
  }),
});

const Product = mongoose.model<AIDocument<IProduct>>(
  "Product",
  productSchema
) as AIModelType<IProduct>;

/**
 * Example 3: User Profile with Skills Matching
 */
interface IUserProfile {
  username: string;
  email: string;
  bio: string;
  skills: string[];
  experience: Array<{
    company: string;
    role: string;
    description: string;
    years: number;
  }>;
  skillsEmbedding?: EmbeddingResult;
}

const userProfileSchema = new mongoose.Schema<IUserProfile>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  bio: String,
  skills: [String],
  experience: [
    {
      company: String,
      role: String,
      description: String,
      years: Number,
    },
  ],
});

// Add skills-based search
userProfileSchema.plugin(aiPlugin, {
  ai: createAIConfig({
    apiKey: process.env.OPENAI_API_KEY!,
    model: "embedding",
    field: "skillsEmbedding",
    includeFields: ["bio", "skills", "experience"],
    excludeFields: ["email"],
  }),
});

const UserProfile = mongoose.model<AIDocument<IUserProfile>>(
  "UserProfile",
  userProfileSchema
) as AIModelType<IUserProfile>;

/**
 * Demo Functions
 */
async function createBlogPost() {
  console.log("\nCreating blog post with AI summary...");

  const blogPost = new BlogPost({
    title: "The Future of AI in Software Development",
    content: `
      Artificial Intelligence is revolutionizing software development. 
      From code generation to automated testing, AI tools are becoming essential 
      for modern developers. Machine learning algorithms can now predict bugs, 
      optimize performance, and suggest architectural improvements.
    `.trim(),
    author: "Jane Developer",
    category: "Technology",
    tags: ["AI", "Software Development"],
  });

  await blogPost.save();

  console.log(`Title: ${blogPost.title}`);
  console.log(`Summary: ${blogPost.aiSummary?.summary}`);
  console.log(`Tokens: ${blogPost.aiSummary?.tokenCount}`);

  return blogPost;
}

async function createProducts() {
  console.log("\nCreating products with embeddings...");

  const products = [
    {
      name: 'MacBook Pro 16"',
      description: "Professional laptop with M2 Pro chip for developers",
      category: "Laptops",
      price: 2399,
      features: ["M2 Pro chip", "16-inch display", "32GB RAM"],
    },
    {
      name: "Dell XPS 13",
      description: "Ultra-portable laptop for business professionals",
      category: "Laptops",
      price: 999,
      features: ["Intel i7", "13-inch display", "16GB RAM"],
    },
    {
      name: 'iPad Pro 12.9"',
      description: "Versatile tablet for creative work and productivity",
      category: "Tablets",
      price: 1099,
      features: ["M2 chip", "12.9-inch display", "Apple Pencil support"],
    },
  ];

  for (const productData of products) {
    const product = new Product(productData);
    await product.save();
    console.log(`Created: ${product.name}`);
  }
}

async function searchProducts() {
  console.log("\nPerforming semantic searches...");

  const searches = [
    "laptop for programming",
    "portable device for creative work",
    "affordable computer",
  ];

  for (const query of searches) {
    const results = await Product.semanticSearch(query, {
      limit: 2,
      threshold: 0.6,
    });

    console.log(`\nQuery: "${query}"`);
    results.forEach((result, index) => {
      console.log(
        `  ${index + 1}. ${result.document.name} - $${
          result.document.price
        } (${result.similarity.toFixed(3)})`
      );
    });
  }
}

async function createUserProfile() {
  console.log("\nCreating user profile...");

  const userProfile = new UserProfile({
    username: "johndoe",
    email: "john@example.com",
    bio: "Full-stack developer passionate about AI and web technologies",
    skills: ["JavaScript", "TypeScript", "React", "Node.js", "MongoDB"],
    experience: [
      {
        company: "TechCorp",
        role: "Senior Developer",
        description: "Led development of AI-powered web applications",
        years: 3,
      },
    ],
  });

  await userProfile.save();
  console.log(`Created profile for: @${userProfile.username}`);

  return userProfile;
}

async function findSimilarUsers() {
  console.log("\nFinding users with similar skills...");

  const results = await UserProfile.semanticSearch(
    "React developer with AI experience",
    {
      limit: 3,
      threshold: 0.7,
    }
  );

  console.log('Users matching "React developer with AI experience":');
  results.forEach((result, index) => {
    console.log(
      `  ${index + 1}. @${
        result.document.username
      } (${result.similarity.toFixed(3)})`
    );
    console.log(`     Skills: ${result.document.skills.join(", ")}`);
  });
}

async function demonstrateManualOperations() {
  console.log("\nManual AI operations...");

  const post = await BlogPost.findOne();
  if (!post) return;

  // Get current AI content
  const currentContent = post.getAIContent();
  console.log(`Current summary: "${currentContent?.summary}"`);

  // Regenerate AI content
  await post.regenerateAI();
  console.log(`New summary: "${post.getAIContent()?.summary}"`);

  // Calculate similarity between products
  const products = await Product.find().limit(2);
  if (products.length >= 2 && products[0].calculateSimilarity) {
    const similarity = products[0].calculateSimilarity(products[1]);
    console.log(`Product similarity: ${similarity.toFixed(3)}`);
  }
}

async function showPerformanceStats() {
  console.log("\nPerformance Statistics...");

  const posts = await BlogPost.find();
  const totalTokens = posts.reduce(
    (sum, post) => sum + (post.aiSummary?.tokenCount || 0),
    0
  );
  const avgProcessingTime =
    posts.reduce(
      (sum, post) => sum + (post.aiSummary?.processingTime || 0),
      0
    ) / posts.length;

  console.log(`Total posts: ${posts.length}`);
  console.log(`Total tokens: ${totalTokens}`);
  console.log(`Avg processing time: ${avgProcessingTime.toFixed(2)}ms`);
  console.log(
    `Estimated cost: $${estimateCost(totalTokens, "gpt-3.5-turbo").toFixed(4)}`
  );
}

/**
 * Main demonstration
 */
async function runDemo() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/mongoose-ai-demo"
    );
    console.log("Connected to MongoDB");

    // Clear existing data for clean demo
    await BlogPost.deleteMany({});
    await Product.deleteMany({});
    await UserProfile.deleteMany({});

    // Run examples
    await createBlogPost();
    await createProducts();
    await searchProducts();
    await createUserProfile();
    await findSimilarUsers();
    await demonstrateManualOperations();
    await showPerformanceStats();

    console.log("\nDemo completed successfully!");
  } catch (error) {
    console.error("Demo failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Export for use in other files
export {
  BlogPost,
  Product,
  UserProfile,
  runDemo,
  createBlogPost,
  createProducts,
  searchProducts,
  createUserProfile,
  findSimilarUsers,
};

// Run demo if executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}
