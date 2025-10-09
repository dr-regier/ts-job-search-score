# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production app with Turbopack
- `pnpm start` - Start production server
- `pnpm tsc --noEmit` - Run TypeScript compiler to check for type errors

## Code Quality

**IMPORTANT**: Always run `pnpm tsc --noEmit` after writing or modifying any code to ensure there are no TypeScript errors before considering the task complete.

## Package Manager

This project strictly uses **pnpm**. Do not use npm or yarn.

## Architecture

This is a TypeScript Next.js 15 application with AI-powered web scraping capabilities using MCP (Model Context Protocol) tools:

### Core Stack

- **Next.js 15** with App Router and Turbopack for fast builds
- **AI SDK 5** with OpenAI GPT-5 integration
- **MCP (Model Context Protocol)** with Firecrawl for web scraping
- **shadcn/ui** components (New York style, neutral base color)
- **Tailwind CSS v4** for styling

### Key Directories

- `app/` - Next.js App Router pages and API routes
- `app/api/agent-with-mcp-tools/` - Main agent endpoint with MCP Firecrawl tools
- `components/chat/` - Chat interface components
- `components/ai-elements/` - Vercel AI Elements components
- `components/agent/` - Agent configuration (system prompts)
  - `web-scraper-prompt.ts` - Web scraper agent system prompt
- `components/agent/tools/` - Directory for AI SDK tools (currently empty - MCP tools loaded dynamically)
- `components/ui/` - shadcn/ui components
- `lib/mcp/` - MCP client implementation for Firecrawl
- `lib/utils.ts` - Utility functions including `cn()` for className merging
- `types/` - TypeScript type definitions

### AI Integration

- Uses AI SDK 5's `streamText()` for streaming responses
- Configured for GPT-5 via OpenAI provider
- MCP Firecrawl integration via `getFirecrawlMCPClient()` in `/lib/mcp/`
- System instructions defined in `components/agent/web-scraper-prompt.ts`
- API route at `/api/agent-with-mcp-tools` with dynamic MCP tool loading
- use useChat for all streaming handling (read the doc first, always, before writing any streaming code: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
- **CRITICAL**: `sendMessage()` from useChat ONLY accepts UIMessage-compatible objects: `sendMessage({ text: "message" })`
- **NEVER** use `sendMessage("string")` - this does NOT work and will cause runtime errors
- Messages from useChat have a `parts` array structure, NOT a simple `content` field
- Tool calls are supported in the response format
- Requires environment variables in `.env.local`
- Reference: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#streamtext

### AI SDK Tools

**CRITICAL REQUIREMENT**: You MUST read the AI SDK tools documentation before working with tools: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling

**ALSO REQUIRED**: Read the manual agent loop cookbook for advanced patterns: https://ai-sdk.dev/cookbook/node/manual-agent-loop

This documentation is essential for understanding:
- How tools are called by language models
- Tool execution flow and lifecycle
- Tool choice strategies (`auto`, `required`, `none`, specific tool)
- Multi-step tool calling with `stopWhen` and `stepCountIs()`
- Tool call monitoring and error handling
- Manual agent loops for complex tool workflows

#### Current AI SDK API (v5.0.44+)

**IMPORTANT**: The AI SDK API has evolved. Always use current patterns:

##### Multi-Step Tool Execution with `stepCountIs()`

```typescript
const result = streamText({
  model: openai("gpt-5"),
  messages: modelMessages,
  tools: mcpTools,
  stopWhen: stepCountIs(10), // CURRENT API - replaces deprecated maxSteps
});
```

##### Tool Choice Strategies

Control how and when tools are called using the `toolChoice` parameter:

```typescript
const result = streamText({
  model: openai("gpt-5"),
  messages: modelMessages,
  tools: mcpTools,
  toolChoice: 'auto', // Options: 'auto', 'required', 'none', or specific tool name
  stopWhen: stepCountIs(5),
});
```

- **`auto` (default)**: Model decides whether to call tools based on context
- **`required`**: Model must call at least one tool before responding
- **`none`**: Disable all tool calls
- **Specific tool**: Force a particular tool to be called

#### MCP Tool Integration

This application uses MCP (Model Context Protocol) to integrate Firecrawl web scraping tools:

- **Location**: MCP client code is in `/lib/mcp/`
- **Dynamic Loading**: Tools are loaded at runtime from the Firecrawl MCP server
- **Current MCP Tools**: Firecrawl provides web scraping and content extraction capabilities
- **Tool Wrapping**: Tools are wrapped with logging to monitor execution

Example from `/app/api/agent-with-mcp-tools/route.ts`:

```typescript
// Initialize Firecrawl MCP client
const firecrawlClient = getFirecrawlMCPClient();
await firecrawlClient.connect();

// Retrieve Firecrawl tools
const tools = await firecrawlClient.getTools();

// Wrap tools to log when they are called
const wrappedTools = Object.fromEntries(
  Object.entries(tools).map(([toolName, toolDef]) => [
    toolName,
    {
      ...toolDef,
      execute: async (args: any) => {
        console.log(`\n🔧 Tool called: ${toolName}`);
        console.log(`   Input:`, JSON.stringify(args, null, 2));
        const result = await toolDef.execute(args);
        console.log(`   Output:`, JSON.stringify(result, null, 2));
        return result;
      },
    },
  ])
);
```

#### Creating New Tools and Agents

**IMPORTANT**: When building more agent and tools functionality, ALWAYS follow the existing patterns in `/components/agent/` and `/lib/mcp/` folders. Study the existing implementations before creating new ones.

When creating new AI SDK tools:
1. Create a new file in `/components/agent/tools/`
2. Use the `tool()` function from `ai` package
3. Define clear Zod input schemas with descriptions
4. Implement error handling in the `execute` function
5. Export from `/components/agent/tools/index.ts`
6. Add the tool to the appropriate API route's tools configuration

When adding new MCP servers:
1. Follow the pattern established in `/lib/mcp/`
2. Create a new client class following `firecrawl-client.ts`
3. Implement connection and tool retrieval methods
4. Add tool wrapping for logging and monitoring

When creating new agents:
1. Follow the pattern established in `/app/api/agent-with-mcp-tools/route.ts`
2. Create new prompts in `/components/agent/` following the structure of `web-scraper-prompt.ts`
3. Use the same streaming patterns and error handling as existing agents
4. Always include proper tool configurations

Example AI SDK tool:
```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const myTool = tool({
  description: 'Clear description of what the tool does',
  inputSchema: z.object({
    param: z.string().describe('What this parameter is for')
  }),
  execute: async ({ param }) => {
    // Tool implementation with logging
    console.log(`🔧 Tool called with param: ${param}`);
    return { result: 'data' };
  }
});
```

#### Tool Call Monitoring

Add logging in tools to monitor execution:

```typescript
// In tool execute function
execute: async ({ query }) => {
  console.log(`🔍 Tool executing with query: "${query}"`);
  try {
    const result = await performAction(query);
    console.log(`✅ Tool completed successfully`);
    return result;
  } catch (error) {
    console.error(`💥 Tool error:`, error);
    throw error;
  }
}
```

#### Tool Call UI Indicators

Display tool execution states using AI Elements:

```typescript
// In ChatAssistant component
{message.parts?.filter(part => part.type === "tool").map((part, i) => {
  const toolState = part.result
    ? "output-available"
    : part.input
      ? "input-available"
      : "input-streaming";

  return (
    <Tool defaultOpen={true}>
      <ToolHeader type={`tool-${part.toolName}`} state={toolState} />
      <ToolContent>
        {part.input && <ToolInput input={part.input} />}
        {part.result && <ToolOutput output={part.result} />}
        {toolState === "input-streaming" && (
          <div>🔍 Processing...</div>
        )}
      </ToolContent>
    </Tool>
  );
})}
```

#### Tool Call Best Practices

- **Clear Descriptions**: Write detailed descriptions to help the model choose the right tool
- **Specific Input Schemas**: Use descriptive Zod schemas with `.describe()` for parameters
- **Error Handling**: Always wrap tool execution in try-catch blocks
- **Logging**: Add console logging to track tool usage and debug issues
- **Return Structure**: Keep return types simple to avoid TypeScript complexity
- **UI Feedback**: Always show tool execution state using AI Elements components

### Chat Architecture

- **Frontend**: `ChatAssistant` component uses `useChat` hook from `@ai-sdk/react`
- **API Route**: Validates messages, converts UIMessages to ModelMessages using `convertToModelMessages()`, streams response via `toUIMessageStreamResponse()`
- **Message Format**: Messages have `parts` array with typed parts (text, tool, etc.), NOT simple `content` field
- **Sending Messages**: MUST use `sendMessage({ text: "message" })` format - string format does NOT work
- **Streaming**: Official `useChat` hook handles streaming automatically
- **Error Handling**: Graceful fallbacks for API failures via `status` monitoring

### UI Components

- **shadcn/ui** configured with:
  - New York style
  - Neutral base color with CSS variables
  - Import aliases: `@/components`, `@/lib/utils`, `@/components/ui`
  - Lucide React for icons
- **AI Elements** from Vercel:
  - Pre-built components for AI applications
  - Located in `components/ai-elements/`
  - Key components: Conversation, Message, PromptInput, Tool, Reasoning
  - Supports tool calls, reasoning tokens, and rich message formatting
  - Reasoning component documentation: https://ai-sdk.dev/elements/components/reasoning#reasoning
  - Reasoning tokens automatically display as collapsible blocks with duration tracking

### Adding Components

- shadcn/ui: `pnpm dlx shadcn@latest add [component-name]`
- AI Elements: `pnpm dlx ai-elements@latest` (adds all components)

## Environment Setup

Create `.env.local` with:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## Critical Rules for useChat Implementation

**NEVER EVER DO THIS:**
- ❌ `sendMessage("string")` - This DOES NOT work and causes runtime errors
- ❌ Accessing `message.content` directly - Messages use `parts` array structure
- ❌ Passing plain strings to sendMessage

**ALWAYS DO THIS:**
- ✅ `sendMessage({ text: "message content" })` - Only UIMessage-compatible objects work
- ✅ Access message content via `message.parts` array
- ✅ Read AI SDK docs before implementing any useChat functionality
