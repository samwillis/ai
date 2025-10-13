# defineTool and defineTools - Type-Safe Tool Definition

## Overview

`defineTool` and `defineTools` are utility functions that provide a cleaner, more type-safe way to define tools for your AI applications. They automatically infer parameter types from JSON Schema and provide full TypeScript autocomplete and validation.

## Benefits

1. **Automatic Type Inference**: Execute function arguments are automatically typed based on your parameter schema
2. **Cleaner Syntax**: No need to repeat tool names or add verbose `type: "function"` declarations
3. **Better DX**: Full TypeScript autocomplete and validation
4. **Less Boilerplate**: Write less code, get more type safety
5. **Easier Maintenance**: Changes to parameters automatically update argument types

## API Reference

### `defineTool`

Define a single tool with full type safety.

```typescript
function defineTool<
  TName extends string,
  TParams extends {
    type: "object";
    properties: Record<string, any>;
    required?: readonly string[];
  }
>(config: DefineToolConfig<TName, TParams>): Tool
```

**Parameters:**

```typescript
interface DefineToolConfig {
  name: string;           // Tool function name
  description: string;    // What the tool does
  parameters: {           // JSON Schema for parameters
    type: "object";
    properties: Record<string, any>;
    required?: readonly string[];
  };
  execute: (args) => Promise<string> | string; // Auto-typed!
}
```

**Returns:** A fully-typed `Tool` object.

### `defineTools`

Define multiple tools at once with full type safety.

```typescript
function defineTools<
  T extends Record<string, {
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: readonly string[];
    };
    execute: (args: any) => Promise<string> | string;
  }>
>(toolsConfig: T): { [K in keyof T]: Tool }
```

**Parameters:** An object where:
- Keys are tool names
- Values are tool configurations (without the `name` field)

**Returns:** An object with the same keys, containing fully-typed `Tool` objects.

## Basic Usage

### Single Tool with `defineTool`

```typescript
import { defineTool } from "@tanstack/ai";

const getWeatherTool = defineTool({
  name: "getWeather",
  description: "Get the current weather for a location",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "City name",
      },
      units: {
        type: "string",
        description: "celsius or fahrenheit",
      },
    },
    required: ["location"], // Only location is required
  },
  execute: async (args) => {
    // ✨ args is automatically typed as:
    // { location: string; units?: string }
    
    console.log(args.location); // ✅ Type-safe!
    console.log(args.units); // ✅ Optional, type-safe!
    
    return JSON.stringify({ temp: 72, condition: "sunny" });
  },
});
```

### Multiple Tools with `defineTools`

```typescript
import { defineTools } from "@tanstack/ai";

const tools = defineTools({
  getWeather: {
    description: "Get the current weather",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string" },
      },
      required: ["location"],
    },
    execute: async (args) => {
      // args: { location: string }
      return JSON.stringify({ temp: 72 });
    },
  },
  
  getTime: {
    description: "Get the current time",
    parameters: {
      type: "object",
      properties: {
        timezone: { type: "string" },
      },
      required: [], // All optional
    },
    execute: async (args) => {
      // args: { timezone?: string }
      const tz = args.timezone || "UTC";
      return new Date().toLocaleString("en-US", { timeZone: tz });
    },
  },
});
```

### Using with AI Instance

```typescript
import { AI, defineTools } from "@tanstack/ai";
import { OpenAIAdapter } from "@tanstack/ai-openai";

const tools = defineTools({
  getWeather: { /* ... */ },
  getTime: { /* ... */ },
});

const ai = new AI({
  adapters: {
    openai: new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY! }),
  },
  tools, // ← Pass tools directly
});

// Use with type-safe tool names
await ai.chat({
  adapter: "openai",
  model: "gpt-4",
  messages: [/* ... */],
  tools: ["getWeather", "getTime"], // ✨ Autocomplete works!
});
```

## Before vs After

### ❌ Before (Manual Approach)

```typescript
const tools = {
  getWeather: {
    type: "function" as const, // Verbose
    function: {
      name: "getWeather", // Duplicate name
      description: "Get the current weather",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string" },
        },
        required: ["location"],
      },
    },
    execute: async ({ location }: { location: string }) => {
      // ❌ Have to manually type parameters
      return JSON.stringify({ temp: 72 });
    },
  },
} as const satisfies ToolConfig;
```

**Issues:**
- Verbose `type: "function"` declaration
- Name duplication (`getWeather` appears twice)
- Manual parameter typing required
- More prone to errors

### ✅ After (With defineTools)

```typescript
const tools = defineTools({
  getWeather: {
    description: "Get the current weather",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string" },
      },
      required: ["location"],
    },
    execute: async (args) => {
      // ✨ args automatically typed as { location: string }
      return JSON.stringify({ temp: 72 });
    },
  },
});
```

**Benefits:**
- No `type: "function"` boilerplate
- Name defined once (as object key)
- Automatic parameter typing
- Cleaner, more maintainable

## Type Inference Examples

### All Required Parameters

```typescript
const tools = defineTools({
  strictTool: {
    description: "All parameters required",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"], // Both required
    },
    execute: async (args) => {
      // ✨ args: { name: string; age: number }
      // No optional properties!
      return `${args.name} is ${args.age}`;
    },
  },
});
```

### All Optional Parameters

```typescript
const tools = defineTools({
  flexibleTool: {
    description: "All parameters optional",
    parameters: {
      type: "object",
      properties: {
        filter: { type: "string" },
        limit: { type: "number" },
      },
      required: [], // None required
    },
    execute: async (args) => {
      // ✨ args: { filter?: string; limit?: number }
      // All properties optional!
      const filter = args.filter ?? "all";
      const limit = args.limit ?? 10;
      return `Showing ${limit} results`;
    },
  },
});
```

### Mixed Required/Optional

```typescript
const tools = defineTools({
  mixedTool: {
    description: "Some required, some optional",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string" },
        update: { type: "string" },
        notify: { type: "boolean" },
      },
      required: ["userId"], // Only userId required
    },
    execute: async (args) => {
      // ✨ args: { userId: string; update?: string; notify?: boolean }
      console.log("User:", args.userId); // Required
      console.log("Update:", args.update); // Optional
      console.log("Notify:", args.notify); // Optional
      return "Done";
    },
  },
});
```

### Complex Types

```typescript
const tools = defineTools({
  updateUser: {
    description: "Update user information",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string" },
        name: { type: "string" },
        age: { type: "number" },
        active: { type: "boolean" },
        tags: { type: "array" },
        metadata: { type: "object" },
      },
      required: ["userId"],
    },
    execute: async (args) => {
      // ✨ args automatically typed as:
      // {
      //   userId: string;
      //   name?: string;
      //   age?: number;
      //   active?: boolean;
      //   tags?: any[];
      //   metadata?: Record<string, any>;
      // }
      
      if (args.name) console.log("Name:", args.name);
      if (args.age !== undefined) console.log("Age:", args.age);
      if (args.active !== undefined) console.log("Active:", args.active);
      
      return JSON.stringify({ success: true });
    },
  },
});
```

## Real-World Example

### E-commerce Store

```typescript
import { AI, defineTools } from "@tanstack/ai";
import { OpenAIAdapter } from "@tanstack/ai-openai";

interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

const products: Product[] = [
  { id: "1", name: "Guitar", price: 599, inStock: true },
  { id: "2", name: "Amplifier", price: 299, inStock: true },
];

const tools = defineTools({
  getGuitars: {
    description: "Get all guitars from the database",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    execute: async () => {
      return JSON.stringify(products);
    },
  },
  
  recommendGuitar: {
    description: "Recommend a guitar to the user",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Guitar ID" },
      },
      required: ["id"],
    },
    execute: async (args) => {
      // args: { id: string }
      const guitar = products.find(p => p.id === args.id);
      return JSON.stringify(guitar || { error: "Not found" });
    },
  },
  
  checkStock: {
    description: "Check if a guitar is in stock",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Guitar ID" },
        quantity: { type: "number", description: "Desired quantity" },
      },
      required: ["id"],
    },
    execute: async (args) => {
      // args: { id: string; quantity?: number }
      const guitar = products.find(p => p.id === args.id);
      
      return JSON.stringify({
        available: guitar?.inStock || false,
        quantity: args.quantity || 1,
      });
    },
  },
});

const ai = new AI({
  adapters: {
    openai: new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY! }),
  },
  tools,
  systemPrompts: [
    "You are a helpful guitar store assistant.",
    "Use the available tools to help customers.",
  ],
});

// Use the AI
const result = await ai.chat({
  adapter: "openai",
  model: "gpt-4",
  messages: [
    { role: "user", content: "Show me guitars in stock" },
  ],
  tools: ["getGuitars", "checkStock"], // Type-safe!
});
```

## Advanced Usage

### Combining Individual and Group Definitions

```typescript
import { defineTool, defineTools } from "@tanstack/ai";

// Define individual tool
const weatherTool = defineTool({
  name: "getWeather",
  description: "Get weather",
  parameters: {
    type: "object",
    properties: {
      location: { type: "string" },
    },
    required: ["location"],
  },
  execute: async (args) => {
    return JSON.stringify({ temp: 72 });
  },
});

// Define group of tools
const timeTools = defineTools({
  getTime: {
    description: "Get current time",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    execute: async () => new Date().toISOString(),
  },
  getDate: {
    description: "Get current date",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    execute: async () => new Date().toDateString(),
  },
});

// Combine them
const allTools = {
  weather: weatherTool,
  ...timeTools,
};

const ai = new AI({
  adapters: { /* ... */ },
  tools: allTools,
});
```

### Error Handling

```typescript
const tools = defineTools({
  processData: {
    description: "Process JSON data",
    parameters: {
      type: "object",
      properties: {
        data: { type: "string", description: "JSON string" },
      },
      required: ["data"],
    },
    execute: async (args) => {
      try {
        const parsed = JSON.parse(args.data);
        return JSON.stringify({ success: true, result: parsed });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: "Invalid JSON",
        });
      }
    },
  },
});
```

### Async Operations

```typescript
const tools = defineTools({
  fetchData: {
    description: "Fetch data from an API",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string" },
        timeout: { type: "number" },
      },
      required: ["url"],
    },
    execute: async (args) => {
      // Simulate API call
      await new Promise(resolve => 
        setTimeout(resolve, args.timeout || 1000)
      );
      
      return JSON.stringify({
        url: args.url,
        data: { message: "Success" },
      });
    },
  },
});
```

## Migration Guide

### Step 1: Install/Update Package

```bash
pnpm install @tanstack/ai@latest
```

### Step 2: Update Imports

```typescript
// Before
import { AI, ToolConfig } from "@tanstack/ai";

// After
import { AI, defineTools } from "@tanstack/ai";
```

### Step 3: Convert Tools

```typescript
// Before
const tools = {
  myTool: {
    type: "function" as const,
    function: {
      name: "myTool",
      description: "...",
      parameters: { /* ... */ },
    },
    execute: async ({ param }: { param: string }) => {
      // Manual typing
    },
  },
} as const satisfies ToolConfig;

// After
const tools = defineTools({
  myTool: {
    description: "...",
    parameters: { /* ... */ },
    execute: async (args) => {
      // Automatic typing!
    },
  },
});
```

### Step 4: Remove Manual Type Assertions

```typescript
// Before
const tools = {
  // ...
} as const satisfies ToolConfig;

// After (no assertions needed!)
const tools = defineTools({
  // ...
});
```

## Type Helpers

The package also exports useful type helpers:

```typescript
import type { ToolNames, ToolArgs } from "@tanstack/ai";

const tools = defineTools({
  myTool: { /* ... */ },
  otherTool: { /* ... */ },
});

// Extract tool names
type Names = ToolNames<typeof tools>; // "myTool" | "otherTool"

// Extract argument types for a specific tool
type MyToolArgs = ToolArgs<typeof tools.myTool>; // { ... }
```

## Best Practices

### 1. Use `defineTools` for Multiple Tools

```typescript
// ✅ Good - defines multiple tools at once
const tools = defineTools({
  tool1: { /* ... */ },
  tool2: { /* ... */ },
  tool3: { /* ... */ },
});
```

### 2. Use `defineTool` for Reusable Individual Tools

```typescript
// ✅ Good - creates a reusable tool
export const weatherTool = defineTool({
  name: "getWeather",
  // ...
});

// Can be used in multiple AI instances
const ai1 = new AI({ tools: { weather: weatherTool } });
const ai2 = new AI({ tools: { weather: weatherTool } });
```

### 3. Add Descriptive Parameter Descriptions

```typescript
// ✅ Good - clear descriptions
const tools = defineTools({
  search: {
    description: "Search the database",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (e.g., 'red guitar')",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (1-100)",
        },
      },
      required: ["query"],
    },
    execute: async (args) => { /* ... */ },
  },
});
```

### 4. Handle Errors Gracefully

```typescript
// ✅ Good - returns error information
execute: async (args) => {
  try {
    const result = await doSomething(args);
    return JSON.stringify({ success: true, data: result });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
```

### 5. Keep Tool Logic Simple

```typescript
// ✅ Good - simple, focused tool
const tools = defineTools({
  getUser: {
    description: "Get user by ID",
    parameters: { /* ... */ },
    execute: async (args) => {
      const user = await db.users.findById(args.id);
      return JSON.stringify(user);
    },
  },
});

// ❌ Avoid - too much logic in execute
execute: async (args) => {
  // Complex validation
  // Multiple database calls
  // Business logic
  // ...
}
```

## Troubleshooting

### Types not inferring correctly?

Make sure you're using `const` assertions where needed:

```typescript
const tools = defineTools({
  myTool: {
    parameters: {
      type: "object" as const, // ← Use `as const` for literal types
      properties: {
        param: { type: "string" as const },
      },
      required: ["param"] as const, // ← Here too
    },
    execute: async (args) => { /* ... */ },
  },
});
```

### Execute function args showing `any`?

This usually means the parameter schema isn't properly structured. Ensure:
- `type: "object"` is present
- `properties` is defined
- Property types are valid JSON Schema types

### Tool names not autocompleting?

Make sure you're passing the tools to the AI constructor:

```typescript
const ai = new AI({
  adapters: { /* ... */ },
  tools, // ← Don't forget this!
});
```

## Examples

See `examples/define-tools-example.ts` for comprehensive examples including:
- Single tool definitions
- Multiple tool definitions
- Complex parameter types
- Real-world e-commerce example
- Error handling
- Async operations
- Type inference demonstrations

## More Information

- **Your Updated File**: `examples/ts-chat/src/routes/demo/api.tanchat.ts`
- **Examples**: `examples/define-tools-example.ts`
- **API Reference**: See inline TypeScript documentation
