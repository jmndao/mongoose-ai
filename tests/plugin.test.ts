/**
 * Tests for mongoose-ai plugin
 */

import { Schema } from "mongoose";
import { aiPlugin, validateApiKey, createAIConfig } from "../src";

// Mock OpenAI to prevent actual API calls during tests
jest.mock("openai", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: "Test summary" } }],
            usage: { total_tokens: 50 },
          }),
        },
      },
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
        }),
      },
    })),
  };
});

// Mock fetch for Ollama tests
global.fetch = jest.fn();

describe("mongoose-ai plugin", () => {
  describe("validateApiKey", () => {
    it("should validate correct OpenAI API key format", () => {
      expect(
        validateApiKey("sk-1234567890abcdef1234567890abcdef12345678", "openai")
      ).toBe(true);
      expect(
        validateApiKey(
          "sk-proj-1234567890abcdef1234567890abcdef12345678",
          "openai"
        )
      ).toBe(true);
    });

    it("should validate correct Anthropic API key format", () => {
      expect(
        validateApiKey(
          "sk-ant-1234567890abcdef1234567890abcdef12345678",
          "anthropic"
        )
      ).toBe(true);
      expect(
        validateApiKey("1234567890abcdef1234567890abcdef12345678", "anthropic")
      ).toBe(true);
    });

    it("should validate Ollama API key (always true)", () => {
      expect(validateApiKey("local", "ollama")).toBe(true);
      expect(validateApiKey("any-value", "ollama")).toBe(true);
      expect(validateApiKey("", "ollama")).toBe(false); // Still reject empty strings
    });

    it("should reject invalid API key formats", () => {
      expect(validateApiKey("", "openai")).toBe(false);
      expect(validateApiKey("invalid-key", "openai")).toBe(false);
      expect(validateApiKey("sk-short", "openai")).toBe(false); // Updated: now returns false correctly
      expect(
        validateApiKey("pk-1234567890abcdef1234567890abcdef12345678", "openai")
      ).toBe(false);
      expect(validateApiKey("sk-", "openai")).toBe(false);
    });

    it("should handle non-string inputs", () => {
      expect(validateApiKey(null as any, "openai")).toBe(false);
      expect(validateApiKey(undefined as any, "openai")).toBe(false);
      expect(validateApiKey(123 as any, "openai")).toBe(false);
    });
  });

  describe("createAIConfig", () => {
    it("should create basic AI configuration", () => {
      const config = createAIConfig({
        apiKey: "sk-test123456789012345678901234567890",
        model: "summary",
        field: "aiSummary",
      });

      expect(config.model).toBe("summary");
      expect(config.provider).toBe("openai");
      expect(config.field).toBe("aiSummary");
      expect(config.credentials.apiKey).toBe(
        "sk-test123456789012345678901234567890"
      );
    });

    it("should create config with custom prompt", () => {
      const config = createAIConfig({
        apiKey: "sk-test123456789012345678901234567890",
        model: "summary",
        field: "aiSummary",
        prompt: "Custom prompt here",
      });

      expect(config.prompt).toBe("Custom prompt here");
    });

    it("should create config with advanced options", () => {
      const config = createAIConfig({
        apiKey: "sk-test123456789012345678901234567890",
        model: "embedding",
        field: "vectorField",
        advanced: {
          maxRetries: 5,
          timeout: 60000,
          logLevel: "debug",
        },
      });

      expect(config.advanced?.maxRetries).toBe(5);
      expect(config.advanced?.timeout).toBe(60000);
      expect(config.advanced?.logLevel).toBe("debug");
    });

    it("should create config with field filters", () => {
      const config = createAIConfig({
        apiKey: "sk-test123456789012345678901234567890",
        model: "summary",
        field: "summary",
        includeFields: ["title", "content"],
        excludeFields: ["password", "email"],
      });

      expect(config.includeFields).toEqual(["title", "content"]);
      expect(config.excludeFields).toEqual(["password", "email"]);
    });
  });

  describe("aiPlugin", () => {
    let schema: Schema;

    beforeEach(() => {
      schema = new Schema({
        title: String,
        content: String,
        author: String,
      });
    });

    describe("configuration validation", () => {
      it("should require valid model type", () => {
        expect(() => {
          schema.plugin(aiPlugin, {
            ai: {
              model: "invalid" as any,
              provider: "openai",
              field: "aiField",
              credentials: { apiKey: "sk-test123456789012345678901234567890" },
            },
          });
        }).toThrow("Valid model (summary|embedding) required");
      });

      it("should require valid provider type", () => {
        expect(() => {
          schema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "invalid" as any,
              field: "aiField",
              credentials: { apiKey: "sk-test123456789012345678901234567890" },
            },
          });
        }).toThrow("Valid provider (openai|anthropic|ollama) required"); // Updated error message
      });

      it("should accept all valid provider types", () => {
        // Test OpenAI
        expect(() => {
          const openaiSchema = schema.clone();
          openaiSchema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "openai",
              field: "openaiField",
              credentials: { apiKey: "sk-test123456789012345678901234567890" },
            },
          });
        }).not.toThrow();

        // Test Anthropic
        expect(() => {
          const anthropicSchema = schema.clone();
          anthropicSchema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "anthropic",
              field: "anthropicField",
              credentials: {
                apiKey: "sk-ant-test123456789012345678901234567890",
              },
            },
          });
        }).not.toThrow();

        // Test Ollama
        expect(() => {
          const ollamaSchema = schema.clone();
          ollamaSchema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "ollama",
              field: "ollamaField",
              credentials: { apiKey: "local" },
            },
          });
        }).not.toThrow();
      });

      it("should require field name", () => {
        expect(() => {
          schema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "openai",
              field: "",
              credentials: { apiKey: "sk-test123456789012345678901234567890" },
            },
          });
        }).toThrow("Field name required");
      });

      it("should require API key", () => {
        expect(() => {
          schema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "openai",
              field: "aiSummary",
              credentials: { apiKey: "" },
            },
          });
        }).toThrow("API key required");
      });
    });

    describe("schema modification", () => {
      it("should add summary field to schema", () => {
        schema.plugin(aiPlugin, {
          ai: {
            model: "summary",
            provider: "openai",
            field: "aiSummary",
            credentials: { apiKey: "sk-test123456789012345678901234567890" },
          },
        });

        expect(schema.paths.aiSummary).toBeDefined();
        expect(schema.paths.aiSummary.schema).toBeDefined();
      });

      it("should add embedding field to schema", () => {
        schema.plugin(aiPlugin, {
          ai: {
            model: "embedding",
            provider: "openai",
            field: "searchEmbedding",
            credentials: { apiKey: "sk-test123456789012345678901234567890" },
          },
        });

        expect(schema.paths.searchEmbedding).toBeDefined();
        expect(schema.paths.searchEmbedding.schema).toBeDefined();
      });

      it("should add Ollama fields to schema", () => {
        schema.plugin(aiPlugin, {
          ai: {
            model: "summary",
            provider: "ollama",
            field: "ollmaSummary",
            credentials: { apiKey: "local" },
          },
        });

        expect(schema.paths.ollmaSummary).toBeDefined();
        expect(schema.paths.ollmaSummary.schema).toBeDefined();
      });

      it("should throw error for duplicate field names", () => {
        schema.add({ existingField: String });

        expect(() => {
          schema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "openai",
              field: "existingField",
              credentials: { apiKey: "sk-test123456789012345678901234567890" },
            },
          });
        }).toThrow('Field "existingField" already exists in schema');
      });
    });

    describe("instance methods", () => {
      it("should add getAIContent method", () => {
        schema.plugin(aiPlugin, {
          ai: {
            model: "summary",
            provider: "openai",
            field: "aiSummary",
            credentials: { apiKey: "sk-test123456789012345678901234567890" },
          },
        });

        expect(schema.methods.getAIContent).toBeDefined();
        expect(typeof schema.methods.getAIContent).toBe("function");
      });

      it("should add regenerateAI method", () => {
        schema.plugin(aiPlugin, {
          ai: {
            model: "summary",
            provider: "openai",
            field: "aiSummary",
            credentials: { apiKey: "sk-test123456789012345678901234567890" },
          },
        });

        expect(schema.methods.regenerateAI).toBeDefined();
        expect(typeof schema.methods.regenerateAI).toBe("function");
      });

      it("should add calculateSimilarity method for embedding models", () => {
        schema.plugin(aiPlugin, {
          ai: {
            model: "embedding",
            provider: "openai",
            field: "searchEmbedding",
            credentials: { apiKey: "sk-test123456789012345678901234567890" },
          },
        });

        expect(schema.methods.calculateSimilarity).toBeDefined();
        expect(typeof schema.methods.calculateSimilarity).toBe("function");
      });

      it("should add calculateSimilarity method for Ollama embedding models", () => {
        schema.plugin(aiPlugin, {
          ai: {
            model: "embedding",
            provider: "ollama",
            field: "ollamaEmbedding",
            credentials: { apiKey: "local" },
          },
        });

        expect(schema.methods.calculateSimilarity).toBeDefined();
        expect(typeof schema.methods.calculateSimilarity).toBe("function");
      });

      it("should not add calculateSimilarity method for summary models", () => {
        schema.plugin(aiPlugin, {
          ai: {
            model: "summary",
            provider: "openai",
            field: "aiSummary",
            credentials: { apiKey: "sk-test123456789012345678901234567890" },
          },
        });

        expect(schema.methods.calculateSimilarity).toBeUndefined();
      });
    });

    describe("static methods", () => {
      it("should add semantic search methods for embedding models", () => {
        schema.plugin(aiPlugin, {
          ai: {
            model: "embedding",
            provider: "openai",
            field: "searchEmbedding",
            credentials: { apiKey: "sk-test123456789012345678901234567890" },
          },
        });

        expect(schema.statics.semanticSearch).toBeDefined();
        expect(typeof schema.statics.semanticSearch).toBe("function");

        expect(schema.statics.findSimilar).toBeDefined();
        expect(typeof schema.statics.findSimilar).toBe("function");
      });

      it("should add semantic search methods for Ollama embedding models", () => {
        schema.plugin(aiPlugin, {
          ai: {
            model: "embedding",
            provider: "ollama",
            field: "ollamaEmbedding",
            credentials: { apiKey: "local" },
          },
        });

        expect(schema.statics.semanticSearch).toBeDefined();
        expect(typeof schema.statics.semanticSearch).toBe("function");

        expect(schema.statics.findSimilar).toBeDefined();
        expect(typeof schema.statics.findSimilar).toBe("function");
      });

      it("should not add semantic search methods for summary models", () => {
        schema.plugin(aiPlugin, {
          ai: {
            model: "summary",
            provider: "openai",
            field: "aiSummary",
            credentials: { apiKey: "sk-test123456789012345678901234567890" },
          },
        });

        expect(schema.statics.semanticSearch).toBeUndefined();
        expect(schema.statics.findSimilar).toBeUndefined();
      });
    });

    describe("plugin integration", () => {
      it("should successfully apply plugin without errors", () => {
        expect(() => {
          schema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "openai",
              field: "aiSummary",
              credentials: { apiKey: "sk-test123456789012345678901234567890" },
            },
          });
        }).not.toThrow();
      });

      it("should apply Ollama plugin without errors", () => {
        expect(() => {
          schema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "ollama",
              field: "ollmaSummary",
              credentials: { apiKey: "local" },
            },
          });
        }).not.toThrow();
      });

      it("should apply plugin with advanced configuration", () => {
        expect(() => {
          schema.plugin(aiPlugin, {
            ai: createAIConfig({
              apiKey: "sk-test123456789012345678901234567890",
              model: "embedding",
              field: "searchVector",
              advanced: {
                maxRetries: 3,
                timeout: 45000,
                logLevel: "info",
              },
              includeFields: ["title", "content"],
              excludeFields: ["password"],
            }),
          });
        }).not.toThrow();

        expect(schema.paths.searchVector).toBeDefined();
        expect(schema.methods.getAIContent).toBeDefined();
        expect(schema.methods.calculateSimilarity).toBeDefined();
        expect(schema.statics.semanticSearch).toBeDefined();
      });

      it("should handle multiple plugin applications on different fields", () => {
        const summarySchema = schema.clone();
        const embeddingSchema = schema.clone();
        const ollamaSchema = schema.clone();

        expect(() => {
          summarySchema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "openai",
              field: "aiSummary",
              credentials: { apiKey: "sk-test123456789012345678901234567890" },
            },
          });

          embeddingSchema.plugin(aiPlugin, {
            ai: {
              model: "embedding",
              provider: "openai",
              field: "searchEmbedding",
              credentials: { apiKey: "sk-test123456789012345678901234567890" },
            },
          });

          ollamaSchema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "ollama",
              field: "ollmaSummary",
              credentials: { apiKey: "local" },
            },
          });
        }).not.toThrow();

        // Summary schema should have summary field and methods
        expect(summarySchema.paths.aiSummary).toBeDefined();
        expect(summarySchema.methods.getAIContent).toBeDefined();
        expect(summarySchema.methods.calculateSimilarity).toBeUndefined();
        expect(summarySchema.statics.semanticSearch).toBeUndefined();

        // Embedding schema should have embedding field and methods
        expect(embeddingSchema.paths.searchEmbedding).toBeDefined();
        expect(embeddingSchema.methods.getAIContent).toBeDefined();
        expect(embeddingSchema.methods.calculateSimilarity).toBeDefined();
        expect(embeddingSchema.statics.semanticSearch).toBeDefined();

        // Ollama schema should have summary field and methods
        expect(ollamaSchema.paths.ollmaSummary).toBeDefined();
        expect(ollamaSchema.methods.getAIContent).toBeDefined();
        expect(ollamaSchema.methods.calculateSimilarity).toBeUndefined();
        expect(ollamaSchema.statics.semanticSearch).toBeUndefined();
      });

      it("should handle invalid OpenAI configuration gracefully", () => {
        expect(() => {
          schema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "openai",
              field: "aiSummary",
              credentials: { apiKey: "invalid-key-format" },
            },
          });
        }).toThrow("Failed to initialize AI provider");
      });
    });

    describe("field validation", () => {
      it("should reject empty field names", () => {
        expect(() => {
          schema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "openai",
              field: "   ",
              credentials: { apiKey: "sk-test123456789012345678901234567890" },
            },
          });
        }).toThrow("Field name required");
      });

      it("should reject non-string field names", () => {
        expect(() => {
          schema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "openai",
              field: 123 as any,
              credentials: { apiKey: "sk-test123456789012345678901234567890" },
            },
          });
        }).toThrow("Field name required");
      });
    });

    describe("credential validation", () => {
      it("should reject empty API keys", () => {
        expect(() => {
          schema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "openai",
              field: "aiSummary",
              credentials: { apiKey: "   " },
            },
          });
        }).toThrow("API key required");
      });

      it("should reject non-string API keys", () => {
        expect(() => {
          schema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "openai",
              field: "aiSummary",
              credentials: { apiKey: 123 as any },
            },
          });
        }).toThrow("API key required");
      });

      it("should reject missing credentials object", () => {
        expect(() => {
          schema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "openai",
              field: "aiSummary",
              credentials: undefined as any,
            },
          });
        }).toThrow("API key required");
      });

      it("should accept Ollama with minimal API key", () => {
        expect(() => {
          schema.plugin(aiPlugin, {
            ai: {
              model: "summary",
              provider: "ollama",
              field: "aiSummary",
              credentials: { apiKey: "local" },
            },
          });
        }).not.toThrow();
      });
    });
  });

  describe("utility functions", () => {
    describe("calculateSimilarity functionality", () => {
      let embeddingSchema: Schema;

      beforeEach(() => {
        embeddingSchema = new Schema({
          title: String,
          content: String,
        });

        embeddingSchema.plugin(aiPlugin, {
          ai: {
            model: "embedding",
            provider: "openai",
            field: "embedding",
            credentials: { apiKey: "sk-test123456789012345678901234567890" },
          },
        });
      });

      it("should return 0 for documents without embeddings", () => {
        const doc1 = { embedding: null };
        const doc2 = { embedding: { embedding: [1, 2, 3] } };

        const similarity = embeddingSchema.methods.calculateSimilarity.call(
          doc1,
          doc2
        );
        expect(similarity).toBe(0);
      });

      it("should return 0 for mismatched vector lengths", () => {
        const doc1 = { embedding: { embedding: [1, 2, 3] } };
        const doc2 = { embedding: { embedding: [1, 2] } };

        const similarity = embeddingSchema.methods.calculateSimilarity.call(
          doc1,
          doc2
        );
        expect(similarity).toBe(0);
      });

      it("should calculate similarity for valid vectors", () => {
        const doc1 = { embedding: { embedding: [1, 0, 0] } };
        const doc2 = { embedding: { embedding: [1, 0, 0] } };

        const similarity = embeddingSchema.methods.calculateSimilarity.call(
          doc1,
          doc2
        );
        expect(similarity).toBe(1);
      });
    });
  });
});
