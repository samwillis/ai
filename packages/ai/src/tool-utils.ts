import type { Tool } from "./types";

/**
 * Helper type to infer parameter types from JSON Schema
 */
type InferSchemaType<T extends Record<string, any>> = {
  [K in keyof T["properties"]]: T["properties"][K]["type"] extends "string"
  ? string
  : T["properties"][K]["type"] extends "number"
  ? number
  : T["properties"][K]["type"] extends "boolean"
  ? boolean
  : T["properties"][K]["type"] extends "array"
  ? any[]
  : T["properties"][K]["type"] extends "object"
  ? Record<string, any>
  : any;
};

/**
 * Configuration for defining a tool with type inference
 */
export interface DefineToolConfig<
  TName extends string = string,
  TParams extends Record<string, any> = Record<string, any>,
  TArgs = InferSchemaType<TParams>
> {
  /**
   * The name of the tool function
   */
  name: TName;
  /**
   * Description of what the tool does
   */
  description: string;
  /**
   * JSON Schema for the tool parameters
   */
  parameters: TParams;
  /**
   * The function to execute when the tool is called.
   * Args are automatically typed based on the parameters schema.
   */
  execute: (args: TArgs) => Promise<string> | string;
}

/**
 * Define a single tool with full type safety and auto-inference.
 * 
 * @example
 * ```typescript
 * const getWeatherTool = defineTool({
 *   name: "getWeather",
 *   description: "Get the current weather",
 *   parameters: {
 *     type: "object",
 *     properties: {
 *       location: { type: "string", description: "City name" },
 *       units: { type: "string", description: "Temperature units" },
 *     },
 *     required: ["location"],
 *   },
 *   execute: async (args) => {
 *     // args is automatically typed as { location: string; units?: string }
 *     return JSON.stringify({ temp: 72 });
 *   },
 * });
 * ```
 */
export function defineTool<
  const TName extends string,
  const TParams extends {
    type: "object";
    properties: Record<string, any>;
    required?: readonly string[];
  }
>(
  config: DefineToolConfig<TName, TParams, InferSchemaType<TParams>>
): Tool & { __toolName: TName } {
  return {
    type: "function" as const,
    function: {
      name: config.name,
      description: config.description,
      parameters: config.parameters,
    },
    execute: config.execute,
    __toolName: config.name,
  } as Tool & { __toolName: TName };
}

/**
 * Define multiple tools at once with full type safety.
 * Returns an object where keys are tool names and values are tool definitions.
 * 
 * @example
 * ```typescript
 * const tools = defineTools({
 *   getWeather: {
 *     description: "Get the current weather",
 *     parameters: {
 *       type: "object",
 *       properties: {
 *         location: { type: "string" },
 *       },
 *       required: ["location"],
 *     },
 *     execute: async (args) => {
 *       // args is typed as { location: string }
 *       return JSON.stringify({ temp: 72 });
 *     },
 *   },
 *   getTime: {
 *     description: "Get the current time",
 *     parameters: {
 *       type: "object",
 *       properties: {
 *         timezone: { type: "string" },
 *       },
 *       required: [],
 *     },
 *     execute: async (args) => {
 *       // args is typed as { timezone?: string }
 *       return new Date().toISOString();
 *     },
 *   },
 * });
 * 
 * // Use with AI constructor
 * const ai = new AI({ adapters, tools });
 * ```
 */
export function defineTools<
  const T extends Record<
    string,
    {
      description: string;
      parameters: {
        type: "object";
        properties: Record<string, any>;
        required?: readonly string[];
      };
      execute: (args: any) => Promise<string> | string;
    }
  >
>(
  toolsConfig: T
): {
    [K in keyof T]: Tool & { __toolName: K };
  } {
  const result = {} as any;

  for (const [name, config] of Object.entries(toolsConfig)) {
    result[name] = {
      type: "function" as const,
      function: {
        name,
        description: config.description,
        parameters: config.parameters,
      },
      execute: config.execute,
      __toolName: name,
    };
  }

  return result;
}

/**
 * Type helper to extract tool names from a tools object created with defineTools
 */
export type ToolNames<T> = T extends Record<string, Tool & { __toolName: infer N }>
  ? N
  : never;

/**
 * Type helper to extract a specific tool's argument type
 */
export type ToolArgs<T extends Tool> = T extends {
  execute: (args: infer A) => any;
}
  ? A
  : never;
