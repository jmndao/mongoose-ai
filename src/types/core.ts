/**
 * Core types and enums
 */

export type AIModel = "summary" | "embedding";
export type AIProvider = "openai" | "anthropic" | "ollama";
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * AI provider credentials
 */
export interface AICredentials {
  apiKey: string;
  organizationId?: string;
}
