/**
 * Function calling types
 */

import { Document } from "mongoose";

/**
 * Function parameter definition
 */
export interface FunctionParameter {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[] | number[];
  items?: FunctionParameter;
  properties?: Record<string, FunctionParameter>;
  required?: boolean;
}

/**
 * Function definition
 */
export interface AIFunction {
  name: string;
  description: string;
  parameters: Record<string, FunctionParameter>;
  handler: (args: any, document: Document) => Promise<void> | void;
}

/**
 * Function execution result
 */
export interface FunctionResult {
  name: string;
  success: boolean;
  result?: any;
  error?: string;
  executedAt: Date;
}

/**
 * Quick function builders
 */
export const QuickFunctions = {
  updateField: (fieldName: string, allowedValues?: string[]): AIFunction => {
    const valueParam: FunctionParameter = {
      type: "string",
      description: `New value for ${fieldName}`,
      required: true,
    };

    if (allowedValues && allowedValues.length > 0) {
      valueParam.enum = allowedValues;
    }

    return {
      name: `update_${fieldName}`,
      description: `Update the ${fieldName} field`,
      parameters: {
        value: valueParam,
      },
      handler: async (args: { value: string }, document: Document) => {
        (document as any)[fieldName] = args.value;
      },
    };
  },

  scoreField: (
    fieldName: string,
    min: number = 0,
    max: number = 10
  ): AIFunction => ({
    name: `score_${fieldName}`,
    description: `Score the ${fieldName} field between ${min} and ${max}`,
    parameters: {
      score: {
        type: "number",
        description: `Score for ${fieldName} (${min}-${max})`,
        required: true,
      },
    },
    handler: async (args: { score: number }, document: Document) => {
      const clampedScore = Math.max(min, Math.min(max, args.score));
      (document as any)[fieldName] = clampedScore;
    },
  }),

  manageTags: (fieldName: string = "tags"): AIFunction => ({
    name: `manage_${fieldName}`,
    description: `Add or remove tags from ${fieldName} array`,
    parameters: {
      action: {
        type: "string",
        description: "Action to perform",
        enum: ["add", "remove", "replace"],
        required: true,
      },
      tags: {
        type: "array",
        description: "Tags to add, remove, or replace with",
        items: { type: "string", description: "Tag name" },
        required: true,
      },
    },
    handler: async (
      args: { action: string; tags: string[] },
      document: Document
    ) => {
      const currentTags = (document as any)[fieldName] || [];

      switch (args.action) {
        case "add":
          (document as any)[fieldName] = [
            ...new Set([...currentTags, ...args.tags]),
          ];
          break;
        case "remove":
          (document as any)[fieldName] = currentTags.filter(
            (tag: string) => !args.tags.includes(tag)
          );
          break;
        case "replace":
          (document as any)[fieldName] = args.tags;
          break;
      }
    },
  }),
};

/**
 * Create a custom function
 */
export function createFunction(
  name: string,
  description: string,
  parameters: Record<string, FunctionParameter>,
  handler: (args: any, document: Document) => Promise<void> | void
): AIFunction {
  return {
    name,
    description,
    parameters,
    handler,
  };
}
