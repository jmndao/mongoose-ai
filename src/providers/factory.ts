/**
 * Provider factory for creating AI provider instances
 */

import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { OllamaProvider } from "./ollama";
import { AIProviderInterface } from "./base";
import {
  AIProvider,
  AICredentials,
  OpenAIModelConfig,
  AnthropicModelConfig,
  OllamaModelConfig,
  AIAdvancedOptions,
} from "../types";

/**
 * Create provider instance based on provider type
 */
export function createProvider(
  provider: AIProvider,
  credentials: AICredentials,
  modelConfig?: OpenAIModelConfig | AnthropicModelConfig | OllamaModelConfig,
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

    case "ollama":
      return new OllamaProvider(
        credentials,
        modelConfig as OllamaModelConfig,
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
    ollama: ["summary", "embedding"], // Ollama supports both
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
