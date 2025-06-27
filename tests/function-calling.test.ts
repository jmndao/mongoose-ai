/**
 * Tests for function calling functionality
 */

import { Schema } from "mongoose";
import {
  aiPlugin,
  createAdvancedAIConfig,
  QuickFunctions,
  createFunction,
} from "../src";

// Mock OpenAI to prevent actual API calls during tests
jest.mock("openai", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: "Test summary",
                  tool_calls: [
                    {
                      function: {
                        name: "update_status",
                        arguments: JSON.stringify({ value: "active" }),
                      },
                    },
                  ],
                },
              },
            ],
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

describe("Function Calling", () => {
  let schema: Schema;

  beforeEach(() => {
    schema = new Schema({
      title: String,
      content: String,
      status: String,
      rating: Number,
      tags: [String],
    });
  });

  describe("QuickFunctions", () => {
    it("should create updateField function", () => {
      const func = QuickFunctions.updateField("status", ["active", "inactive"]);

      expect(func.name).toBe("update_status");
      expect(func.description).toBe("Update the status field");
      expect(func.parameters.value.type).toBe("string");
      expect(func.parameters.value.enum).toEqual(["active", "inactive"]);
    });

    it("should create scoreField function", () => {
      const func = QuickFunctions.scoreField("rating", 1, 5);

      expect(func.name).toBe("score_rating");
      expect(func.description).toBe("Score the rating field between 1 and 5");
      expect(func.parameters.score.type).toBe("number");
    });

    it("should create manageTags function", () => {
      const func = QuickFunctions.manageTags("categories");

      expect(func.name).toBe("manage_categories");
      expect(func.description).toBe("Add or remove tags from categories array");
      expect(func.parameters.action.enum).toEqual(["add", "remove", "replace"]);
    });
  });

  describe("createFunction", () => {
    it("should create custom function", () => {
      const handler = jest.fn();
      const func = createFunction(
        "custom_action",
        "Custom action description",
        {
          param1: { type: "string", description: "Test parameter" },
        },
        handler
      );

      expect(func.name).toBe("custom_action");
      expect(func.description).toBe("Custom action description");
      expect(func.parameters.param1.type).toBe("string");
      expect(func.handler).toBe(handler);
    });
  });

  describe("Plugin with functions", () => {
    it("should add functions to schema", () => {
      expect(() => {
        schema.plugin(aiPlugin, {
          ai: createAdvancedAIConfig({
            apiKey: "sk-test123456789012345678901234567890",
            provider: "openai",
            model: "summary",
            field: "aiSummary",
            advanced: {
              enableFunctions: true,
            },
            functions: [
              QuickFunctions.updateField("status"),
              QuickFunctions.scoreField("rating"),
            ],
          }),
        });
      }).not.toThrow();

      expect(schema.paths.aiSummary).toBeDefined();
    });

    it("should work without functions (backward compatibility)", () => {
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

      expect(schema.paths.aiSummary).toBeDefined();
    });

    it("should validate provider supports functions", () => {
      expect(() => {
        schema.plugin(aiPlugin, {
          ai: createAdvancedAIConfig({
            apiKey: "sk-ant-test123456789012345678901234567890",
            provider: "anthropic",
            model: "embedding", // Anthropic doesn't support embeddings
            field: "aiEmbedding",
          }),
        });
      }).toThrow("Provider 'anthropic' does not support model 'embedding'");
    });
  });

  describe("Function execution", () => {
    it("should execute updateField function", async () => {
      const document = { status: "inactive" };
      const func = QuickFunctions.updateField("status", ["active", "inactive"]);

      await func.handler({ value: "active" }, document as any);

      expect(document.status).toBe("active");
    });

    it("should execute scoreField function", async () => {
      const document = { rating: 0 };
      const func = QuickFunctions.scoreField("rating", 1, 5);

      await func.handler({ score: 4 }, document as any);

      expect(document.rating).toBe(4);
    });

    it("should clamp scoreField values", async () => {
      const document = { rating: 0 };
      const func = QuickFunctions.scoreField("rating", 1, 5);

      await func.handler({ score: 10 }, document as any);

      expect(document.rating).toBe(5); // Clamped to max
    });

    it("should execute manageTags function", async () => {
      const document = { tags: ["existing"] };
      const func = QuickFunctions.manageTags("tags");

      await func.handler(
        { action: "add", tags: ["new", "another"] },
        document as any
      );

      expect(document.tags).toEqual(["existing", "new", "another"]);
    });
  });

  describe("Provider validation", () => {
    it("should validate OpenAI API key", () => {
      expect(() => {
        schema.plugin(aiPlugin, {
          ai: createAdvancedAIConfig({
            apiKey: "invalid-key",
            provider: "openai",
            model: "summary",
            field: "aiSummary",
          }),
        });
      }).toThrow("Invalid API key format for openai");
    });

    it("should validate Anthropic API key", () => {
      expect(() => {
        schema.plugin(aiPlugin, {
          ai: createAdvancedAIConfig({
            apiKey: "short",
            provider: "anthropic",
            model: "summary",
            field: "aiSummary",
          }),
        });
      }).toThrow("Invalid API key format for anthropic");
    });
  });

  describe("Advanced configuration", () => {
    it("should create advanced config with functions", () => {
      const config = createAdvancedAIConfig({
        apiKey: "sk-test123456789012345678901234567890",
        provider: "openai",
        model: "summary",
        field: "aiSummary",
        advanced: {
          enableFunctions: true,
          maxRetries: 3,
        },
        functions: [QuickFunctions.updateField("status")],
      });

      expect(config.provider).toBe("openai");
      expect(config.advanced?.enableFunctions).toBe(true);
      expect(config.advanced?.maxRetries).toBe(3);
      expect(config.functions).toHaveLength(1);
    });

    it("should default enableFunctions to false", () => {
      const config = createAdvancedAIConfig({
        apiKey: "sk-test123456789012345678901234567890",
        provider: "openai",
        model: "summary",
        field: "aiSummary",
      });

      expect(config.advanced?.enableFunctions).toBe(false);
    });
  });
});
