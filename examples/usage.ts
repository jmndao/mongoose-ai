/**
 * Clean Usage Examples for mongoose-ai
 * Professional implementation patterns
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
} from "mongoose-ai";

// Environment validation
const envCheck = checkEnvironment();
if (!envCheck.isValid) {
  console.error("❌ Environment setup required:", envCheck.missing);
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

  // AI-generated fields
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
    prompt:
      "Create an engaging summary that highlights the key insights and would encourage readers to read the full article:",
    includeFields: ["title", "content", "category", "tags"],
    excludeFields: ["author"], // Keep author private from AI processing
    advanced: {
      maxRetries: 3,
      timeout: 30000,
      skipOnUpdate: true,
      logLevel: "info",
    },
    modelConfig: {
      chatModel: "gpt-3.5-turbo",
      maxTokens: 150,
      temperature: 0.4,
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
  brand: string;
  price: number;
  features: string[];
  specifications: Record<string, any>;

  // AI-generated fields
  searchEmbedding?: EmbeddingResult;
}

const productSchema = new mongoose.Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  brand: String,
  price: { type: Number, required: true },
  features: [String],
  specifications: mongoose.Schema.Types.Mixed,
});

// Add semantic search capabilities
productSchema.plugin(aiPlugin, {
  ai: createAIConfig({
    apiKey: process.env.OPENAI_API_KEY!,
    model: "embedding",
    field: "searchEmbedding",
    includeFields: ["name", "description", "category", "features"],
    excludeFields: ["price", "specifications"], // Exclude from search context
    advanced: {
      skipOnUpdate: false, // Regenerate on updates
      logLevel: "warn",
    },
  }),
});

const Product = mongoose.model<AIDocument<IProduct>>(
  "Product",
  productSchema
) as AIModelType<IProduct>;

/**
 * Example 3: User Profile with Both Summary and Search
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

  // AI-generated fields
  profileSummary?: SummaryResult;
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

// Add profile summarization
userProfileSchema.plugin(aiPlugin, {
  ai: createAIConfig({
    apiKey: process.env.OPENAI_API_KEY!,
    model: "summary",
    field: "profileSummary",
    prompt:
      "Create a professional summary highlighting key skills, experience, and expertise:",
    includeFields: ["bio", "skills", "experience"],
    excludeFields: ["email"], // Keep email private
  }),
});

// Add skills-based search (clone schema to avoid conflicts)
const userSearchSchema = userProfileSchema.clone();
userSearchSchema.plugin(aiPlugin, {
  ai: createAIConfig({
    apiKey: process.env.OPENAI_API_KEY!,
    model: "embedding",
    field: "skillsEmbedding",
    includeFields: ["skills", "experience"],
  }),
});

const UserProfile = mongoose.model<AIDocument<IUserProfile>>(
  "UserProfile",
  userSearchSchema
) as AIModelType<IUserProfile>;

/**
 * Usage Examples
 */
async function demonstrateUsage() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/mongoose-ai-demo"
    );
    console.log("✅ Connected to MongoDB");

    // Example 1: Create blog post with auto-summary
    console.log("\n📝 Creating blog post with AI summary...");

    const blogPost = new BlogPost({
      title: "The Future of AI in Software Development",
      content: `
        Artificial Intelligence is revolutionizing software development in unprecedented ways. 
        From code generation to automated testing, AI tools are becoming essential for modern developers.
        
        Machine learning algorithms can now predict bugs, optimize performance, and even suggest 
        architectural improvements. The integration of large language models into development 
        workflows has opened new possibilities for natural language programming.
        
        As we look ahead, the convergence of AI and software development promises to democratize 
        coding while enhancing the capabilities of experienced developers.
      `.trim(),
      author: "Jane Developer",
      category: "Technology",
      tags: ["AI", "Software Development", "Machine Learning"],
    });

    await blogPost.save();
    console.log(`✨ Generated summary: "${blogPost.aiSummary?.summary}"`);
    console.log(
      `📊 Tokens used: ${blogPost.aiSummary?.tokenCount}, Processing time: ${blogPost.aiSummary?.processingTime}ms`
    );

    // Example 2: Create products and perform semantic search
    console.log("\n🛍️ Creating products with embeddings...");

    const products = [
      {
        name: 'MacBook Pro 16"',
        description:
          "Professional laptop with M2 Pro chip, perfect for developers and creators",
        category: "Laptops",
        brand: "Apple",
        price: 2399,
        features: ["M2 Pro chip", "16-inch display", "32GB RAM", "1TB SSD"],
      },
      {
        name: "Dell XPS 13",
        description:
          "Ultra-portable laptop ideal for business professionals and students",
        category: "Laptops",
        brand: "Dell",
        price: 999,
        features: ["Intel i7", "13-inch display", "16GB RAM", "512GB SSD"],
      },
      {
        name: 'iPad Pro 12.9"',
        description:
          "Versatile tablet for creative work, note-taking, and productivity",
        category: "Tablets",
        brand: "Apple",
        price: 1099,
        features: [
          "M2 chip",
          "12.9-inch display",
          "Apple Pencil support",
          "256GB storage",
        ],
      },
    ];

    for (const productData of products) {
      const product = new Product(productData);
      await product.save();
      console.log(
        `✅ Created: ${product.name} (${product.searchEmbedding?.dimensions} dimensions)`
      );
    }

    // Perform semantic search
    console.log("\n🔍 Performing semantic searches...");

    const searches = [
      "professional laptop for programming",
      "portable device for creative work",
      "affordable computer for students",
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
          } (similarity: ${result.similarity.toFixed(3)})`
        );
      });
    }

    // Example 3: User profiles with skills matching
    console.log("\n👥 Creating user profiles...");

    const userProfile = new UserProfile({
      username: "johndoe",
      email: "john@example.com",
      bio: "Full-stack developer passionate about AI and modern web technologies",
      skills: [
        "JavaScript",
        "TypeScript",
        "React",
        "Node.js",
        "MongoDB",
        "Machine Learning",
      ],
      experience: [
        {
          company: "TechCorp",
          role: "Senior Developer",
          description:
            "Led development of AI-powered web applications using React and Node.js",
          years: 3,
        },
        {
          company: "StartupXYZ",
          role: "Full Stack Developer",
          description:
            "Built scalable backend services and modern frontend interfaces",
          years: 2,
        },
      ],
    });

    await userProfile.save();
    console.log(`✨ Profile summary: "${userProfile.profileSummary?.summary}"`);

    // Find users with similar skills
    const similarUsers = await UserProfile.semanticSearch(
      "React developer with AI experience",
      {
        limit: 3,
        threshold: 0.7,
      }
    );

    console.log('\n🎯 Users matching "React developer with AI experience":');
    similarUsers.forEach((result, index) => {
      console.log(
        `  ${index + 1}. @${
          result.document.username
        } (similarity: ${result.similarity.toFixed(3)})`
      );
      console.log(`     Skills: ${result.document.skills.join(", ")}`);
    });

    // Example 4: Performance monitoring
    console.log("\n📈 Performance monitoring...");

    const allBlogPosts = await BlogPost.find();
    const totalTokens = allBlogPosts.reduce(
      (sum, post) => sum + (post.aiSummary?.tokenCount || 0),
      0
    );
    const avgProcessingTime =
      allBlogPosts.reduce(
        (sum, post) => sum + (post.aiSummary?.processingTime || 0),
        0
      ) / allBlogPosts.length;

    console.log(`📊 Blog Posts Stats:`);
    console.log(`  - Total posts processed: ${allBlogPosts.length}`);
    console.log(`  - Total tokens used: ${totalTokens}`);
    console.log(
      `  - Average processing time: ${avgProcessingTime.toFixed(2)}ms`
    );
    console.log(
      `  - Estimated cost: $${estimateCost(
        totalTokens,
        "gpt-3.5-turbo"
      ).toFixed(4)}`
    );

    console.log("\n✅ All examples completed successfully!");
  } catch (error) {
    console.error("❌ Error in demonstration:", error);
  } finally {
    await mongoose.connection.close();
    console.log("👋 Database connection closed");
  }
}

// Example 5: Manual AI operations
async function manualAIOperations() {
  const post = await BlogPost.findOne();
  if (!post) return;

  console.log("\n🔧 Manual AI operations...");

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
    console.log(`Similarity between products: ${similarity.toFixed(3)}`);
  }
}

// Run demonstrations
if (require.main === module) {
  demonstrateUsage()
    .then(() => manualAIOperations())
    .catch(console.error);
}

export { BlogPost, Product, UserProfile, demonstrateUsage, manualAIOperations };
