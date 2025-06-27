/**
 * Provider factory for creating AI provider instances
 */

import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { AIProviderInterface } from "./base";
import {
  AIProvider,
  AICredentials,
  OpenAIModelConfig,
  AnthropicModelConfig,
  AIAdvancedOptions,
} from "../types";

/**
 * Create provider instance based on provider type
 */
export function createProvider(
  provider: AIProvider,
  credentials: AICredentials,
  modelConfig?: OpenAIModelConfig | AnthropicModelConfig,
  advancedOptions?: AIAdvancedOptions
): AIProviderInterface {
  switch (provider) {
    case "openai":
      return new OpenAIProvider(
        credentials,
        modelConfig as OpenAIModelConfig,
        advancedOptions
      );

    case "anthropic":
      return new AnthropicProvider(
        credentials,
        modelConfig as AnthropicModelConfig,
        advancedOptions
      );

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Validate provider supports the requested model
 */
export function validateProviderModel(
  provider: AIProvider,
  model: string
): void {
  const supportedModels = {
    openai: ["summary", "embedding"],
    anthropic: ["summary"], // Anthropic doesn't support embeddings
  };

  const supported = supportedModels[provider];
  if (!supported || !supported.includes(model)) {
    throw new Error(
      `Provider '${provider}' does not support model '${model}'. Supported models: ${
        supported?.join(", ") || "none"
      }`
    );
  }
}
