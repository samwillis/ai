# defineTool & defineTools - Quick Start

## What is it?

Type-safe utility functions for defining AI tools with automatic parameter type inference. No more manual typing or boilerplate!

## Quick Example

### ❌ Before (Verbose & Error-Prone)

```typescript
const tools = {
  getWeather: {
    type: "function" as const, // Boilerplate
    function: {
      name: "getWeather", // Name duplication
      description: "Get weather",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string" },
        },
        required: ["location"],
      },
    },
    execute: async ({ location }: { location: string }) => {
      // ❌ Manual typing required
      return JSON.stringify({ temp: 72 });
    },
  },
} as const satisfies ToolConfig;
```

### ✅ After (Clean & Type-Safe)

```typescript
import { defineTools } from "@tanstack/ai";

const tools = defineTools({
  getWeather: {
    description: "Get weather",
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

## Two Ways to Define Tools

### 1. `defineTool` - Single Tool

```typescript
import { defineTool } from "@tanstack/ai";

const weatherTool = defineTool({
  name: "getWeather",
  description: "Get the current weather",
  parameters: {
    type: "object",
    properties: {
      location: { type: "string" },
      units: { type: "string" },
    },
    required: ["location"],
  },
  execute: async (args) => {
    // args: { location: string; units?: string }
    return JSON.stringify({ temp: 72 });
  },
});
```

### 2. `defineTools` - Multiple Tools

```typescript
import { defineTools } from "@tanstack/ai";

const tools = defineTools({
  getWeather: {
    description: "Get weather",
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
    description: "Get current time",
    parameters: {
      type: "object",
      properties: {
        timezone: { type: "string" },
      },
      required: [],
    },
    execute: async (args) => {
      // args: { timezone?: string }
      return new Date().toISOString();
    },
  },
});
```

## Key Features

### ✨ Automatic Type Inference

```typescript
const tools = defineTools({
  myTool: {
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        active: { type: "boolean" },
      },
      required: ["name"], // Only name is required
    },
    execute: async (args) => {
      // ✨ args automatically typed as:
      // { name: string; age?: number; active?: boolean }
      
      args.name; // ✅ string
      args.age; // ✅ number | undefined
      args.active; // ✅ boolean | undefined
    },
  },
});
```

### 🎯 Type-Safe Tool Names

```typescript
const ai = new AI({
  adapters: { /* ... */ },
  tools, // Register tools
});

await ai.chat({
  messages: [/* ... */],
  tools: ["getWeather", "getTime"], // ✨ Autocomplete works!
});
```

### 📝 Less Boilerplate

**Compare:**

```typescript
// Old way: ~15 lines
const oldTool = {
  type: "function" as const,
  function: {
    name: "myTool",
    description: "...",
    parameters: { /* ... */ },
  },
  execute: async ({ param }: { param: string }) => { /* ... */ },
} as const satisfies ToolConfig;

// New way: ~8 lines
const newTool = defineTools({
  myTool: {
    description: "...",
    parameters: { /* ... */ },
    execute: async (args) => { /* ... */ }, // Auto-typed!
  },
});
```

## Real-World Example

### Your Guitar Store (Updated!)

```typescript
import { AI, defineTools } from "@tanstack/ai";
import { OpenAIAdapter } from "@tanstack/ai-openai";
import guitars from "@/data/guitars";

// ✅ Clean, type-safe tool definitions
const tools = defineTools({
  getGuitars: {
    description: "Get all guitars from the database",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    execute: async () => {
      return JSON.stringify(guitars);
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
      // ✨ args automatically typed as { id: string }
      return JSON.stringify({ id: args.id });
    },
  },
});

const ai = new AI({
  adapters: {
    openAi: new OpenAIAdapter({ apiKey: process.env.AI_KEY! }),
  },
  tools, // Register tools once
  systemPrompts: ["You are a guitar store assistant."],
});

// Use tools with type-safe names
return ai.chat({
  adapter: "openAi",
  model: "gpt-4o",
  messages,
  tools: ["getGuitars", "recommendGuitar"], // ✨ Autocomplete!
});
```

## Migration in 3 Steps

### Step 1: Update Import

```typescript
// Before
import { AI, ToolConfig } from "@tanstack/ai";

// After
import { AI, defineTools } from "@tanstack/ai";
```

### Step 2: Replace Tool Definitions

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
    execute: async ({ param }: { param: string }) => { /* ... */ },
  },
} as const satisfies ToolConfig;

// After
const tools = defineTools({
  myTool: {
    description: "...",
    parameters: { /* ... */ },
    execute: async (args) => { /* ... */ }, // Auto-typed!
  },
});
```

### Step 3: Remove Type Assertions

```typescript
// Before
} as const satisfies ToolConfig;

// After (not needed!)
});
```

## Type Inference Examples

### All Required

```typescript
const tools = defineTools({
  strictTool: {
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"], // Both required
    },
    execute: async (args) => {
      // args: { name: string; age: number }
      // No optional properties!
    },
  },
});
```

### All Optional

```typescript
const tools = defineTools({
  flexibleTool: {
    parameters: {
      type: "object",
      properties: {
        filter: { type: "string" },
        limit: { type: "number" },
      },
      required: [], // All optional
    },
    execute: async (args) => {
      // args: { filter?: string; limit?: number }
      const filter = args.filter ?? "all";
      const limit = args.limit ?? 10;
    },
  },
});
```

### Mixed

```typescript
const tools = defineTools({
  mixedTool: {
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
      // args: { userId: string; update?: string; notify?: boolean }
    },
  },
});
```

## Common Patterns

### Error Handling

```typescript
const tools = defineTools({
  processData: {
    description: "Process JSON data",
    parameters: {
      type: "object",
      properties: {
        data: { type: "string" },
      },
      required: ["data"],
    },
    execute: async (args) => {
      try {
        const parsed = JSON.parse(args.data);
        return JSON.stringify({ success: true, result: parsed });
      } catch (error) {
        return JSON.stringify({ success: false, error: "Invalid JSON" });
      }
    },
  },
});
```

### Async Operations

```typescript
const tools = defineTools({
  fetchData: {
    description: "Fetch from API",
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
      return JSON.stringify({ data: "..." });
    },
  },
});
```

### Database Queries

```typescript
const tools = defineTools({
  getUser: {
    description: "Get user by ID",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string" },
      },
      required: ["userId"],
    },
    execute: async (args) => {
      const user = await db.users.findById(args.userId);
      return JSON.stringify(user);
    },
  },
});
```

## Benefits Summary

| Feature | Before | After |
|---------|--------|-------|
| **Type Safety** | Manual typing | Automatic inference |
| **Boilerplate** | ~15 lines | ~8 lines |
| **Name Definition** | Twice (key + name field) | Once (just key) |
| **Type Assertions** | Required (`as const`) | Not needed |
| **Autocomplete** | Limited | Full support |
| **Maintainability** | Update types manually | Types update automatically |
| **Error Prone** | Type mismatches possible | Compile-time validation |

## Quick Tips

1. **Use `defineTools` for multiple tools** - Cleaner and more organized
2. **Use `defineTool` for reusable individual tools** - Better for sharing
3. **Let TypeScript infer types** - Don't add manual type annotations to `args`
4. **Add good descriptions** - Helps the AI understand when to use tools
5. **Keep execute functions simple** - Complex logic should be in separate functions

## More Information

- **Full Documentation**: `DEFINE_TOOLS.md`
- **Examples**: `examples/define-tools-example.ts`
- **Your Updated File**: `examples/ts-chat/src/routes/demo/api.tanchat.ts`

## That's It!

You now have cleaner, more type-safe tool definitions with automatic parameter inference. 🎉

```typescript
// The new way - simple, clean, type-safe!
const tools = defineTools({
  myTool: {
    description: "...",
    parameters: { /* ... */ },
    execute: async (args) => { /* ... */ }, // ✨ Magic!
  },
});
```
