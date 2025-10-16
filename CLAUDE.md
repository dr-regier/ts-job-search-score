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

This is a TypeScript Next.js 15 application with AI-powered job search and matching capabilities using multi-agent architecture:

### Core Stack

- **Next.js 15** with App Router and Turbopack for fast builds
- **AI SDK 5** with OpenAI GPT-5 integration
- **MCP (Model Context Protocol)** with Firecrawl for web scraping
- **Adzuna API** for job board searches
- **shadcn/ui** components (New York style, neutral base color)
- **Tailwind CSS v4** for styling
- **localStorage** for data persistence (no database)

### Key Directories

- `app/` - Next.js App Router pages and API routes
  - `app/api/chat/` - Job Discovery Agent endpoint (Firecrawl MCP + Adzuna + custom tools)
  - `app/api/match/` - Job Matching Agent endpoint (scoring and fit analysis)
  - `app/api/resume/` - Resume Generator Agent endpoint (resume tailoring for jobs)
  - `app/profile/` - User profile creation and editing page
  - `app/jobs/` - Jobs dashboard with metrics, filtering, and management
  - `app/resumes/` - Resume library for uploading and managing resumes
- `components/` - React components organized by feature
  - `components/chat/` - Multi-agent chat interface
  - `components/profile/` - Profile form and scoring weights UI
  - `components/jobs/` - Jobs dashboard components (metrics, table, cards, resume generation)
  - `components/resumes/` - Resume library components (upload, cards, editing)
  - `components/layout/` - Shared layout components (Header with navigation)
  - `components/ai-elements/` - Vercel AI Elements components
  - `components/ui/` - shadcn/ui base components
  - `components/agent/` - Agent configuration and tools
    - `components/agent/prompts/` - Agent system prompts
    - `components/agent/tools/` - Custom AI SDK tools
- `lib/` - Core utilities and integrations
  - `lib/mcp/` - MCP client implementation for Firecrawl
  - `lib/storage/` - localStorage utilities (profile.ts, jobs.ts, resumes.ts)
  - `lib/context/` - React Context providers for global state management
  - `lib/utils.ts` - Utility functions including `cn()` for className merging
- `types/` - TypeScript type definitions (job.ts, profile.ts, resume.ts)

### AI Integration

- Uses AI SDK 5's `streamText()` for streaming responses
- Configured for GPT-5 via OpenAI provider
- Multi-agent architecture with three specialized agents:
  - **Job Discovery Agent** (`/api/chat`) - Autonomous job search across multiple sources
  - **Job Matching Agent** (`/api/match`) - Intelligent scoring and fit analysis
  - **Resume Generator Agent** (`/api/resume`) - AI-powered resume tailoring for specific jobs
- MCP Firecrawl integration via `getFirecrawlMCPClient()` in `/lib/mcp/`
- Custom tools: Adzuna API search, save jobs, score jobs, generate tailored resumes
- System instructions defined in `components/agent/prompts/`
- Agent coordination via localStorage (no direct agent-to-agent calls)
- use useChat for all streaming handling (read the doc first, always, before writing any streaming code: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
- **CRITICAL**: `sendMessage()` from useChat ONLY accepts UIMessage-compatible objects: `sendMessage({ text: "message" })`
- **NEVER** use `sendMessage("string")` - this does NOT work and will cause runtime errors
- Messages from useChat have a `parts` array structure, NOT a simple `content` field
- Tool calls are supported in the response format
- Requires environment variables in `.env.local`
- Reference: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#streamtext

### Agent Architecture

**Job Discovery Agent** - Autonomously finds jobs across multiple sources
- Tools: Firecrawl MCP (scrape, search), Adzuna API, web search, save jobs
- Responsibilities: Search strategy, source selection, result refinement, job discovery
- Output: Temporary job listings displayed in chat (user must explicitly save)
- API: `/api/chat/route.ts`
- Prompt: `components/agent/prompts/job-discovery-prompt.ts`

**Job Matching Agent** - Analyzes jobs against user profile with detailed scoring
- Tools: Firecrawl MCP (for company research), web search, score jobs
- Responsibilities: Job fit analysis, weighted scoring, gap identification, priority assignment
- Output: Scored jobs with reasoning, breakdown, and recommendations
- API: `/api/match/route.ts`
- Prompt: `components/agent/prompts/job-matching-prompt.ts`

**Resume Generator Agent** - Tailors master resumes for specific job opportunities
- Tools: Firecrawl MCP (for company research), web search, generate tailored resume
- Responsibilities: Resume analysis, content reordering, keyword integration, maintaining authenticity
- Output: Tailored resume with change documentation and alignment analysis
- API: `/api/resume/route.ts`
- Prompt: `components/agent/prompts/resume-generator-prompt.ts`
- Configuration: Uses GPT-5 with `reasoning_effort: 'medium'` for quality output
- Process: 5-step agent loop with `stopWhen: stepCountIs(5)`
- Critical Rules:
  - ❌ NEVER fabricate experience, skills, or accomplishments
  - ❌ NEVER add projects, companies, or roles not in master resume
  - ✅ ONLY reorder bullets, emphasize relevant experience, mirror keywords naturally

**Agent Coordination**
- Agents do NOT directly call each other
- Communication via localStorage (shared state)
- User controls workflow (explicit save/score requests)
- Each agent demonstrates autonomy within its domain

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

#### Custom Tools Implemented

**Adzuna API Tool** (`components/agent/tools/adzuna.ts`)
- Searches jobs across multiple companies via Adzuna API
- Input: query, location (optional), resultsCount (default 20, max 50)
- Output: Array of Job objects with action: "display"
- Used by Job Discovery Agent for broad job searches

**Save Jobs Tool** (`components/agent/tools/save-jobs.ts`)
- Saves selected jobs to user's profile (localStorage)
- Input: jobs array, criteria description (optional)
- Output: Saved jobs with action: "saved" and savedIds array
- Only called when user explicitly requests to save jobs
- Marks jobs with applicationStatus: "saved"

**Score Jobs Tool** (`components/agent/tools/score-jobs.ts`)
- Returns scored jobs with detailed fit analysis
- Input: scoredJobs array with score, breakdown, reasoning, gaps, priority
- Output: Scored jobs data with action: "scored" and statistics
- Used by Job Matching Agent to return analysis results
- Client-side handler updates localStorage

**Generate Tailored Resume Tool** (`components/agent/tools/generate-resume.ts`)
- Generates tailored resumes for specific job opportunities
- Input: jobId, masterResumeId, tailoredResumeContent, changes array, matchAnalysis
- Output: Tailored resume with action: "generated", change documentation, alignment score
- Helper function: `getResumeGenerationContext(jobId, masterResumeId)` fetches job, resume, profile from localStorage
- Context injection: Job details, requirements, master resume content, user profile formatted as string
- Used by Resume Generator Agent to return tailored resume results
- Client-side handler displays resume with copy/download functionality
- Changes tracked by type: reorder, keyword, emphasis, summary, trim, section_move

#### Creating New Tools and Agents

**IMPORTANT**: When building more agent and tools functionality, ALWAYS follow the existing patterns in `/components/agent/` and `/lib/mcp/` folders. Study the existing implementations before creating new ones.

When creating new AI SDK tools:
1. Create a new file in `/components/agent/tools/`
2. Use Zod schemas for input validation (not the `tool()` function)
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
1. Follow the pattern established in `/app/api/chat/route.ts` or `/app/api/match/route.ts`
2. Create new prompts in `/components/agent/prompts/` following existing structures
3. Use the same streaming patterns and error handling as existing agents
4. Always include proper tool configurations
5. Wrap tools with logging for debugging

Example AI SDK tool:
```typescript
import { z } from 'zod';

export const myTool = {
  description: 'Clear description of what the tool does',
  inputSchema: z.object({
    param: z.string().describe('What this parameter is for')
  }),
  execute: async ({ param }: { param: string }) => {
    // Tool implementation with logging
    console.log(`🔧 Tool called with param: ${param}`);
    return {
      action: 'display',
      result: 'data'
    };
  }
};
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

- **Global State**: `ChatContext` provider (`lib/context/ChatContext.tsx`) manages all chat state
  - Wraps entire app in `app/layout.tsx` for persistence across navigation
  - Hosts both `useChat` hooks at context level (prevents state loss on navigation)
  - Manages savedJobs, userProfile, activeAgent state
  - Provides `clearChat()` method to reset conversation while preserving data
- **Frontend**: `ChatAssistant` component (`components/chat/chat-assistant.tsx`) with dual-agent support
  - Simplified to 446 lines by consuming state from ChatContext
  - No local state management - all state comes from context
- **Multi-Agent Coordination**: Two `useChat` hooks (Discovery + Matching) merged into single conversation
- **Intelligent Routing**: Automatic agent selection based on user intent detection
  - Keywords: 'score', 'analyze', 'match', 'fit', 'rate', 'evaluate', 'assess', 'rank', 'priority', 'compare'
  - Checks for saved jobs and profile before routing to Matching Agent
- **API Routes**:
  - `/api/chat` - Job Discovery Agent
  - `/api/match` - Job Matching Agent (receives jobs and profile in body)
- **Message Merging**: `React.useMemo` combines messages from both agents chronologically
- **Message Format**: Messages have `parts` array with typed parts (text, tool, etc.), NOT simple `content` field
- **Sending Messages**: MUST use `sendMessage({ text: "message" })` format - string format does NOT work
- **Streaming**: Official `useChat` hook handles streaming automatically for both agents
- **State Management**: localStorage integration for jobs and profile, auto-refresh after agent actions
- **Chat Persistence**: Chat history persists across page navigation (in-memory via ChatContext)
- **Clear Chat Feature**: AlertDialog confirms clearing history while preserving jobs and profile
- **Error Handling**: Graceful fallbacks for API failures via `status` monitoring

### UI Components

- **shadcn/ui** configured with:
  - New York style
  - Neutral base color with CSS variables
  - Import aliases: `@/components`, `@/lib/utils`, `@/components/ui`
  - Lucide React for icons
  - Components used: Button, Input, Textarea, Label, Slider, Select, Badge, Card, Table, AlertDialog
- **AI Elements** from Vercel:
  - Pre-built components for AI applications
  - Located in `components/ai-elements/`
  - Key components: Conversation, Message, PromptInput, Tool, Reasoning
  - Supports tool calls, reasoning tokens, and rich message formatting
  - Reasoning component documentation: https://ai-sdk.dev/elements/components/reasoning#reasoning
  - Reasoning tokens automatically display as collapsible blocks with duration tracking
- **react-hook-form** with Zod validation for profile forms
- **Custom animations** in `app/globals.css` for premium UI effects

### UI Pages

#### **Profile Page** (`/profile`)
- Form-based profile creation and editing
- **ProfileForm component**: Comprehensive form with react-hook-form + Zod validation
  - Fields: Name, Professional Background (min 10 chars), Skills (comma-separated)
  - Salary range with validation (min < max)
  - Preferred locations and job preferences
  - Deal breakers (textarea)
- **ScoringWeights component**: Interactive sliders for 5 scoring categories
  - Real-time validation (must sum to 100%)
  - Visual indicator (green when valid, red when invalid)
  - Range: 0-100, step: 5
- Loads existing profile from localStorage
- Pre-populates form if profile exists
- Success message display on save
- Indicator if profile was created via chat

#### **Jobs Dashboard** (`/jobs`)
- Premium dashboard with professional design (Stripe/Linear/Notion quality)
- **HeroSection**: Animated gradient banner with rocket emoji
- **ActionCards**: 4 quick-action cards (Profile Setup, Discover Jobs, Score Jobs, View Dashboard)
- **DashboardMetrics**: 5 metric cards with real-time calculations
  - Total Jobs, High Priority, Medium Priority, Average Score, Last Updated
  - Color-coded numbers with icons
  - Staggered fade-in animations
- **JobTable**: Advanced table with filtering and sorting
  - Filters: Priority (All/High/Medium/Low), Status (All/Saved/Applied/Interviewing/Offer/Rejected)
  - Sorting: Score (High/Low), Date (Newest/Oldest), Company (A-Z)
  - Large color-coded score display
  - Priority badges (pill-shaped with proper colors)
  - Status dropdown per row with localStorage sync
  - Action buttons: View (external link), Generate Resume (✨ sparkles icon), Remove (with confirmation dialog), Apply (external link)
  - Generate Resume button triggers GenerateResumeDialog with purple hover effect
  - Remove button uses AlertDialog for confirmation with destructive styling
  - Empty state with helpful message
  - Results counter
- **ScoreBreakdown**: Circular score indicator with animated progress bars
  - Color-coded categories (blue, green, purple, yellow, red)
  - Staggered animations on render
- **JobCard**: Premium card design with dual states (saved/unsaved)
  - Hover effects with lift and shadow
  - Expandable description
  - Score breakdown integration
  - Analysis and skill gaps display
- **GenerateResumeDialog**: Two-phase dialog for resume generation
  - Selection phase: Job details display, resume dropdown selector, generate button
  - Generated phase: Match analysis, changes made, resume content viewer, copy/download buttons
  - Uses useChat with custom transport to inject jobId and masterResumeId
  - Watches for tool results with action: "generated"
  - Copy to clipboard functionality with success indicator
  - Download as .md file with sanitized filename

#### **Resume Library** (`/resumes`)
- Clean, professional design matching Profile page style
- **Page Header**: Simple text-based header with description
- **Upload Section**: File upload component with validation
  - Accepts .md, .markdown, .txt files (max 50KB)
  - Drag-and-drop or click to select
  - Real-time validation feedback
  - Success/error message display
- **Resume Grid**: Grid layout displaying resume cards (3 columns on large screens)
  - Resume count indicator
  - Empty state with helpful message and upload prompt
- **ResumeCard**: Individual resume display with actions
  - Resume name and format badge (Markdown/Text)
  - Upload date
  - Content preview (first 200 characters)
  - Action buttons: View (full content), Edit (name/content), Delete (with confirmation)
  - Hover effects with border color change
- **ResumeEditDialog**: Modal for editing resume details
  - Edit resume name
  - Edit resume content in textarea (markdown-friendly)
  - Save/Cancel actions
  - Updates localStorage on save
- **View Resume Dialog**: Full-screen content viewer
  - Displays complete resume content in monospace font
  - Formatted with whitespace preservation
  - Upload date display
  - Close button
- **Tip Section**: Contextual help (shown when resumes exist)
  - Gray background with Lightbulb icon
  - Links to resume generation feature from Jobs dashboard
- **Data Storage**: Uses localStorage via `lib/storage/resumes.ts`
  - Resume interface: id, name, content, uploadedAt, format, sections
  - Automatic section parsing (summary, experience, skills, education)
  - SSR-safe storage operations

#### **Home Page / Chat Interface** (`/`)
- **Header component** with navigation between Chat, Jobs, Resumes, and Profile
- **Clear Chat button** with confirmation dialog (AlertDialog)
  - RotateCcw icon, outline variant
  - Positioned at top of chat interface below header
  - Confirms before clearing to prevent accidental data loss
  - Preserves saved jobs and profile data
  - Resets both agent conversations and message tracking
- Active page highlighting
- Navigation icons: Home (Chat), Briefcase (Jobs), FileText (Resumes), User (Profile)

### Adding Components

- shadcn/ui: `pnpm dlx shadcn@latest add [component-name]`
- AI Elements: `pnpm dlx ai-elements@latest` (adds all components)

## Environment Setup

Create `.env.local` with:

```
OPENAI_API_KEY=your_openai_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
ADZUNA_APP_ID=your_adzuna_app_id_here
ADZUNA_API_KEY=your_adzuna_api_key_here
```

**Required APIs:**
- **OpenAI API** - GPT-5 for agent reasoning and responses
- **Firecrawl API** - Web scraping for company career pages
- **Adzuna API** - Job board search across multiple sources

**Optional (for RAG features if implemented):**
- `VECTORIZE_ACCESS_TOKEN` - Vectorize for document retrieval
- `VECTORIZE_ORG_ID` - Your Vectorize organization ID
- `VECTORIZE_PIPELINE_ID` - Your Vectorize pipeline ID

## Critical Rules for useChat Implementation

**NEVER EVER DO THIS:**
- ❌ `sendMessage("string")` - This DOES NOT work and causes runtime errors
- ❌ Accessing `message.content` directly - Messages use `parts` array structure
- ❌ Passing plain strings to sendMessage

**ALWAYS DO THIS:**
- ✅ `sendMessage({ text: "message content" })` - Only UIMessage-compatible objects work
- ✅ Access message content via `message.parts` array
- ✅ Read AI SDK docs before implementing any useChat functionality
