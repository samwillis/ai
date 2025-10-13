/**
 * defineTool and defineTools Examples
 * 
 * This example demonstrates the new type-safe tool definition utilities that provide:
 * 1. Automatic type inference for execute function arguments
 * 2. Cleaner, more concise tool definitions
 * 3. Full TypeScript autocomplete and validation
 * 4. Better developer experience
 */

import { AI, defineTool, defineTools } from "@tanstack/ai";
import { OpenAIAdapter } from "@tanstack/ai-openai";

// ============================================
// Example 1: Using defineTool for single tool
// ============================================

const getWeatherTool = defineTool({
  name: "getWeather",
  description: "Get the current weather for a location",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "City name (e.g., 'New York', 'London')",
      },
      units: {
        type: "string",
        description: "Temperature units: 'celsius' or 'fahrenheit'",
      },
    },
    required: ["location"], // Only location is required
  },
  execute: async (args) => {
    // ✨ args is automatically typed as:
    // { location: string; units?: string }

    console.log("Location:", args.location); // ✅ Type-safe!
    console.log("Units:", args.units); // ✅ Optional, type-safe!

    // Simulate API call
    return JSON.stringify({
      location: args.location,
      temperature: 72,
      units: args.units || "fahrenheit",
      condition: "sunny",
    });
  },
});

// ============================================
// Example 2: Using defineTools for multiple tools
// ============================================

const tools = defineTools({
  getWeather: {
    description: "Get the current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "City name" },
        units: { type: "string", description: "celsius or fahrenheit" },
      },
      required: ["location"],
    },
    execute: async (args) => {
      // ✨ args automatically typed as { location: string; units?: string }
      return JSON.stringify({ temp: 72, condition: "sunny" });
    },
  },

  getTime: {
    description: "Get the current time in a timezone",
    parameters: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description: "IANA timezone (e.g., 'America/New_York')",
        },
      },
      required: [], // All properties optional
    },
    execute: async (args) => {
      // ✨ args automatically typed as { timezone?: string }
      const tz = args.timezone || "UTC";
      return new Date().toLocaleString("en-US", { timeZone: tz });
    },
  },

  calculateSum: {
    description: "Calculate the sum of two numbers",
    parameters: {
      type: "object",
      properties: {
        a: { type: "number", description: "First number" },
        b: { type: "number", description: "Second number" },
      },
      required: ["a", "b"],
    },
    execute: async (args) => {
      // ✨ args automatically typed as { a: number; b: number }
      const sum = args.a + args.b;
      return `The sum of ${args.a} and ${args.b} is ${sum}`;
    },
  },

  searchDatabase: {
    description: "Search the database with optional filters",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        limit: { type: "number", description: "Max results" },
        category: { type: "string", description: "Category filter" },
      },
      required: ["query"],
    },
    execute: async (args) => {
      // ✨ args automatically typed as:
      // { query: string; limit?: number; category?: string }

      console.log("Search query:", args.query); // Required
      console.log("Limit:", args.limit ?? 10); // Optional with default
      console.log("Category:", args.category); // Optional

      return JSON.stringify({ results: [], total: 0 });
    },
  },
});

// ============================================
// Example 3: Using tools with AI instance
// ============================================

const ai = new AI({
  adapters: {
    openai: new OpenAIAdapter({
      apiKey: process.env.OPENAI_API_KEY!,
    }),
  },
  tools, // ← Pass tools object directly
});

async function chatWithTools() {
  const result = await ai.chat({
    adapter: "openai",
    model: "gpt-4",
    messages: [
      { role: "user", content: "What's the weather in New York?" },
    ],
    tools: ["getWeather"], // ✨ Type-safe! Autocomplete shows available tools
  });

  console.log("Response:", result.content);
}

// ============================================
// Example 4: Before vs After Comparison
// ============================================

// ❌ BEFORE: Verbose, manual typing, error-prone
const oldStyleTools = {
  getWeather: {
    type: "function" as const,
    function: {
      name: "getWeather",
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
      // Have to manually type args ^^^
      return JSON.stringify({ temp: 72 });
    },
  },
} as const;

// ✅ AFTER: Concise, auto-typed, type-safe
const newStyleTools = defineTools({
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
      // args automatically typed! ✨
      return JSON.stringify({ temp: 72 });
    },
  },
});

// ============================================
// Example 5: Complex parameter types
// ============================================

const advancedTools = defineTools({
  updateUser: {
    description: "Update user information",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "User ID" },
        name: { type: "string", description: "User name" },
        email: { type: "string", description: "User email" },
        age: { type: "number", description: "User age" },
        active: { type: "boolean", description: "Is user active" },
        tags: { type: "array", description: "User tags" },
        metadata: { type: "object", description: "Additional metadata" },
      },
      required: ["userId"],
    },
    execute: async (args) => {
      // ✨ args typed as:
      // {
      //   userId: string;
      //   name?: string;
      //   email?: string;
      //   age?: number;
      //   active?: boolean;
      //   tags?: any[];
      //   metadata?: Record<string, any>;
      // }

      console.log("Updating user:", args.userId);
      if (args.name) console.log("New name:", args.name);
      if (args.email) console.log("New email:", args.email);
      if (args.age !== undefined) console.log("New age:", args.age);

      return JSON.stringify({ success: true });
    },
  },
});

// ============================================
// Example 6: Combining defineTool with defineTools
// ============================================

// Define some tools individually
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
  execute: async (args) => JSON.stringify({ temp: 72 }),
});

// Define others as a group
const utilityTools = defineTools({
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
  ...utilityTools,
  weather: weatherTool,
};

// ============================================
// Example 7: Real-world e-commerce example
// ============================================

interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

const products: Product[] = [
  { id: "1", name: "Guitar", price: 599, inStock: true },
  { id: "2", name: "Amplifier", price: 299, inStock: true },
  { id: "3", name: "Drum Kit", price: 899, inStock: false },
];

const ecommerceTools = defineTools({
  getProducts: {
    description: "Get all products from the catalog",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", description: "Filter by category" },
        inStockOnly: { type: "boolean", description: "Show only in-stock items" },
      },
      required: [],
    },
    execute: async (args) => {
      let filtered = products;

      if (args.inStockOnly) {
        filtered = filtered.filter(p => p.inStock);
      }

      return JSON.stringify(filtered);
    },
  },

  getProductDetails: {
    description: "Get detailed information about a specific product",
    parameters: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Product ID" },
      },
      required: ["productId"],
    },
    execute: async (args) => {
      const product = products.find(p => p.id === args.productId);

      if (!product) {
        return JSON.stringify({ error: "Product not found" });
      }

      return JSON.stringify(product);
    },
  },

  checkInventory: {
    description: "Check if a product is in stock",
    parameters: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Product ID" },
        quantity: { type: "number", description: "Desired quantity" },
      },
      required: ["productId"],
    },
    execute: async (args) => {
      const product = products.find(p => p.id === args.productId);

      if (!product) {
        return JSON.stringify({ available: false, reason: "Product not found" });
      }

      return JSON.stringify({
        available: product.inStock,
        productName: product.name,
        requestedQuantity: args.quantity || 1,
      });
    },
  },
});

const ecommerceAI = new AI({
  adapters: {
    openai: new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY! }),
  },
  tools: ecommerceTools,
  systemPrompts: [
    "You are a helpful e-commerce assistant.",
    "Use the available tools to help customers find and purchase products.",
  ],
});

async function handleCustomerQuery() {
  const result = await ecommerceAI.chat({
    adapter: "openai",
    model: "gpt-4",
    messages: [
      { role: "user", content: "Show me guitars that are in stock" },
    ],
    tools: ["getProducts", "getProductDetails", "checkInventory"],
  });

  console.log("Assistant:", result.content);
}

// ============================================
// Example 8: Type inference demonstration
// ============================================

const typedTools = defineTools({
  // All required parameters
  strictTool: {
    description: "All parameters required",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"],
    },
    execute: async (args) => {
      // args: { name: string; age: number }
      // No optional properties!
      const name: string = args.name; // ✅
      const age: number = args.age; // ✅
      return `${name} is ${age} years old`;
    },
  },

  // No required parameters
  flexibleTool: {
    description: "All parameters optional",
    parameters: {
      type: "object",
      properties: {
        filter: { type: "string" },
        limit: { type: "number" },
      },
      required: [],
    },
    execute: async (args) => {
      // args: { filter?: string; limit?: number }
      // All properties optional!
      const filter = args.filter ?? "all";
      const limit = args.limit ?? 10;
      return `Showing ${limit} results for ${filter}`;
    },
  },

  // Mixed required/optional
  mixedTool: {
    description: "Some required, some optional",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string" },
        update: { type: "string" },
        notify: { type: "boolean" },
      },
      required: ["userId"], // Only userId is required
    },
    execute: async (args) => {
      // args: { userId: string; update?: string; notify?: boolean }
      console.log("User:", args.userId); // Required
      console.log("Update:", args.update); // Optional
      console.log("Notify:", args.notify); // Optional
      return "Done";
    },
  },
});

// ============================================
// Example 9: Error handling
// ============================================

const robustTools = defineTools({
  processData: {
    description: "Process data with error handling",
    parameters: {
      type: "object",
      properties: {
        data: { type: "string", description: "JSON data to process" },
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
          error: "Invalid JSON data",
        });
      }
    },
  },
});

// ============================================
// Example 10: Async operations
// ============================================

const asyncTools = defineTools({
  fetchData: {
    description: "Fetch data from an API",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "API endpoint" },
        timeout: { type: "number", description: "Timeout in ms" },
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
        data: { message: "Data fetched successfully" },
      });
    },
  },
});

// Run examples
async function main() {
  console.log("=== Example 3: Chat with tools ===");
  await chatWithTools();

  console.log("\n=== Example 7: E-commerce ===");
  await handleCustomerQuery();
}

// Uncomment to run:
// main().catch(console.error);

export {
  getWeatherTool,
  tools,
  advancedTools,
  ecommerceTools,
  typedTools,
  robustTools,
  asyncTools,
};
