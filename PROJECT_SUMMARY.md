# AI Job Application Agent - Project Summary

## Overview

The AI Job Application Agent is an intelligent job search and matching system designed to automate and optimize the job hunting process. Built with a multi-agent architecture, it combines autonomous job discovery with sophisticated fit analysis to help job seekers find and prioritize opportunities that match their qualifications and preferences.

This capstone project demonstrates advanced AI engineering concepts including multi-agent orchestration, tool-calling LLMs, web scraping via MCP, and intelligent scoring systems.

## Problem Statement

Job seekers spend 10-20+ hours per week manually searching for positions across multiple platforms. The process is fragmented and inefficient:
- Manually visiting company career pages and job boards
- Reading through dozens of job descriptions
- Comparing requirements against qualifications
- Losing track of applications and their status

**Solution:** An AI-powered system that autonomously discovers jobs from multiple sources, analyzes fit with detailed scoring and reasoning, and helps users focus on high-priority opportunities.

## Technical Architecture

### Core Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **AI/ML**: AI SDK 5 (Vercel), OpenAI GPT-5
- **Integrations**:
  - Model Context Protocol (MCP) with Firecrawl for web scraping
  - Adzuna API for job board searches
- **UI**: shadcn/ui (Radix UI + Tailwind CSS v4), AI Elements
- **State Management**: localStorage (no database/authentication)
- **Build Tools**: Turbopack, pnpm

### Multi-Agent System

**Job Discovery Agent** (`/api/chat/route.ts`)
- **Purpose**: Autonomous job search across multiple sources
- **Tools**: Firecrawl MCP (scrape, search), Adzuna API, web search, save jobs
- **Capabilities**:
  - Decides which sources to search based on user query
  - Autonomously refines searches if initial results are insufficient
  - Determines when enough jobs have been found
  - Presents jobs temporarily (user must explicitly save)
- **Prompt**: 146-line system prompt defining autonomous behavior

**Job Matching Agent** (`/api/match/route.ts`)
- **Purpose**: Intelligent job fit analysis and scoring
- **Tools**: Firecrawl MCP (company research), web search, score jobs
- **Capabilities**:
  - Analyzes jobs against user profile using LLM reasoning
  - Generates weighted scores (0-100) across 5 categories
  - Identifies qualification gaps with actionable feedback
  - Assigns priority levels (high ≥85, medium 70-84, low <70)
- **Prompt**: 214-line system prompt defining scoring methodology

**Agent Coordination**
- Agents do NOT directly call each other
- Communication via localStorage (shared state pattern)
- User controls workflow with explicit commands
- Each agent demonstrates autonomy within its domain

## Key Features

### 1. Multi-Source Job Discovery
- **Firecrawl MCP**: Scrapes company career pages in real-time
- **Adzuna API**: Searches job boards with 50+ sources
- **Autonomous decisions**: Agent chooses tools and search strategy
- **Result refinement**: Automatically adjusts if initial results are poor

### 2. Intelligent Job Scoring
- **Weighted scoring**: 5 configurable factors (salary, location, company, role, requirements)
- **Default weights**: Salary 30%, Company 25%, Location 20%, Role 15%, Requirements 10%
- **Detailed reasoning**: Natural language explanation for each score
- **Gap identification**: Lists missing qualifications with context
- **Priority assignment**: Auto-categorizes jobs by score threshold

### 3. Explicit Save Workflow
- Jobs discovered are **temporary** (displayed in chat)
- User must **explicitly save** jobs to profile
- Natural language save commands: "save top 5", "save all remote", "save jobs 2, 5, 12"
- Saved jobs persist in localStorage with status tracking

### 4. Chat-First Interface
- Built with AI Elements (Vercel's pre-built AI UI components)
- Streaming responses with visible tool execution
- Reasoning tokens displayed as collapsible blocks
- Natural language interaction for all operations

### 5. Data Persistence
- **localStorage-based**: No database or authentication required
- **User Profile**: Skills, salary range, preferences, scoring weights
- **Jobs**: Discovered jobs with optional scores and application status
- **SSR-safe**: All storage utilities check for browser environment

## Custom Tools Implementation

### Adzuna API Tool (`components/agent/tools/adzuna.ts`)
```typescript
- Input: query, location (optional), resultsCount (1-50)
- Output: Job[] with action: "display"
- Features: Auto-mapping to Job interface, salary formatting, requirement extraction
```

### Save Jobs Tool (`components/agent/tools/save-jobs.ts`)
```typescript
- Input: jobs[], criteria (optional description)
- Output: Saved jobs with action: "saved", savedIds[]
- Behavior: Marks jobs with applicationStatus: "saved", adds timestamp
```

### Score Jobs Tool (`components/agent/tools/score-jobs.ts`)
```typescript
- Input: scoredJobs[] (with score, breakdown, reasoning, gaps, priority)
- Output: Scored data with action: "scored", statistics
- Behavior: Returns analysis for client-side localStorage update
```

## Data Models

### Job Interface (`types/job.ts`)
```typescript
{
  id: string                    // UUID
  title: string
  company: string
  location: string
  salary?: string
  description: string
  requirements: string[]
  url: string
  source: "firecrawl" | "adzuna" | "manual"
  discoveredAt: string          // ISO timestamp

  // Scoring data (added by Matching Agent)
  score?: number                // 0-100
  scoreBreakdown?: {            // Category scores
    salaryMatch: number
    locationFit: number
    companyAppeal: number
    roleMatch: number
    requirementsFit: number
  }
  reasoning?: string            // Why this score
  gaps?: string[]               // Missing qualifications
  priority?: "high" | "medium" | "low"

  // Application tracking
  applicationStatus?: "saved" | "applied" | "interviewing" | "offer" | "rejected"
  statusUpdatedAt?: string
  notes?: string
}
```

### UserProfile Interface (`types/profile.ts`)
```typescript
{
  name: string
  professionalBackground: string
  skills: string[]
  salaryMin: number
  salaryMax: number
  preferredLocations: string[]
  jobPreferences: string[]
  dealBreakers: string
  scoringWeights: {
    salaryMatch: number         // Default 30
    locationFit: number         // Default 20
    companyAppeal: number       // Default 25
    roleMatch: number           // Default 15
    requirementsFit: number     // Default 10
  }
  updatedAt: string
  createdVia?: "chat" | "form"
}
```

## Storage Utilities

### Profile Storage (`lib/storage/profile.ts`)
- `getProfile()`: Retrieve user profile or null
- `saveProfile(profile)`: Save with auto-timestamp
- `deleteProfile()`: Clear profile data
- `hasProfile()`: Check existence
- `updateProfile(updates)`: Merge partial updates

### Jobs Storage (`lib/storage/jobs.ts`)
- `getJobs()`: Retrieve all saved jobs
- `saveJobs(jobs)`: Replace jobs array
- `addJobs(newJobs)`: Append with deduplication
- `updateJobStatus(jobId, status)`: Change application status
- `updateJobsWithScores(scoredJobs)`: Merge score data by ID
- `getJobById(jobId)`: Retrieve single job
- `deleteJob(jobId)`: Remove specific job
- `deleteAllJobs()`: Clear all jobs
- `updateJobNotes(jobId, notes)`: Add/update notes
- `getJobsByStatus(status)`: Filter by application status
- `getJobsByPriority(priority)`: Filter by score priority
- `getScoredJobs()`: Only jobs with scores
- `getUnsavedJobs()`: Only temporary jobs

All functions are SSR-safe and handle errors gracefully.

## Development Workflow

### Commands
```bash
pnpm dev              # Start development server (Turbopack)
pnpm build            # Production build with Turbopack
pnpm start            # Start production server
pnpm tsc --noEmit     # Type check (required after changes)
```

### Environment Variables
```
OPENAI_API_KEY          # GPT-5 for agent reasoning
FIRECRAWL_API_KEY       # Web scraping for career pages
ADZUNA_APP_ID           # Job board search
ADZUNA_API_KEY          # Job board search
```

### Key Dependencies
- `ai` (5.0.44+): AI SDK with tool calling and streaming
- `@ai-sdk/openai`, `@ai-sdk/react`: OpenAI integration and React hooks
- `@modelcontextprotocol/sdk`: MCP client for Firecrawl
- `uuid`: Unique job ID generation
- `zod`: Schema validation for tool inputs
- `next` (15.5.3): React framework with App Router
- `react` (19.1.0): UI library
- `tailwindcss` (v4): Styling
- `shadcn/ui`: Component library (Radix UI primitives)

## Technical Achievements

### 1. Multi-Agent Architecture
- Designed two specialized agents with distinct responsibilities
- Implemented indirect coordination via shared state (localStorage)
- Demonstrated autonomous decision-making within each agent's domain
- Clear separation of concerns (discovery vs. analysis)

### 2. Tool-Calling LLMs
- Integrated MCP protocol for dynamic tool loading
- Created 3 custom tools with Zod validation
- Wrapped all tools with logging for debugging
- Proper error handling and fallback behaviors

### 3. Advanced Prompting
- 146-line Job Discovery prompt with autonomous decision criteria
- 214-line Job Matching prompt with detailed scoring methodology
- Clear definitions of success/failure conditions
- Examples of autonomous decision-making loops

### 4. Web Scraping Integration
- MCP client implementation for Firecrawl
- Dynamic tool discovery and execution
- Handles scraping errors gracefully
- Combines multiple sources (scraping + API)

### 5. Intelligent Scoring System
- Configurable weighted scoring (5 factors, must sum to 100)
- LLM-based reasoning for each score component
- Gap identification with actionable recommendations
- Priority assignment for user workflow optimization

### 6. Type-Safe Architecture
- Full TypeScript coverage across frontend and backend
- Zod schemas for runtime validation
- Interface definitions for all data models
- Type utilities for derived types (JobSource, ApplicationStatus, etc.)

### 7. Modern UI/UX
- AI Elements for transparent tool execution
- Streaming responses with real-time feedback
- Collapsible reasoning blocks
- Natural language commands throughout

## Learning Outcomes

### AI/ML Engineering
- Multi-agent system design and coordination
- Prompt engineering for autonomous agents
- Tool-calling LLM implementation
- LLM reasoning for complex analysis tasks

### Web Technologies
- Next.js 15 App Router patterns
- Server vs. client component architecture
- Streaming responses with `useChat` hook
- SSR-safe client-side storage

### Integration Skills
- Model Context Protocol (MCP) implementation
- Third-party API integration (Adzuna)
- Tool wrapping and error handling
- Dynamic tool discovery and execution

### Software Engineering
- TypeScript best practices
- State management patterns (localStorage)
- Error handling and graceful degradation
- Logging and debugging strategies

## Future Enhancements

### Near-term (Week 3)
- Profile form UI for manual editing
- Jobs dashboard with table view
- Job detail pages with full analysis
- Application status tracking UI

### Stretch Goals
- Supervisor agent for full orchestration
- Profile Creator agent (extract from conversation)
- Resume Generator agent
- Cover Letter agent
- Email notifications for status changes
- Interactive analytics dashboard

### Advanced Features
- Multi-user support with authentication
- Database persistence (PostgreSQL/Supabase)
- Resume matching test tool (from Python prototype)
- Cost estimation and usage tracking
- Export functionality (PDF, CSV)
- Browser extension for one-click job saves

## Project Context

**Purpose**: Capstone project demonstrating AI engineering capabilities

**Personal motivation**: Built during career transition from account management/sales to AI engineering

**Target users**:
- Active job seekers with limited time
- Career transitioners changing industries/roles
- Anyone conducting strategic (vs. spray-and-pray) job search

**Success metrics**:
- Time saved: 5 hours → 30 minutes for job discovery
- Job coverage: 20+ relevant jobs across 3-5 companies
- Match quality: 80%+ relevance to user profile
- Autonomy: 5-10 independent decisions per search

**Demo-ready features**:
- Autonomous agent behavior visible in tool execution
- Multi-source intelligence (Firecrawl + Adzuna)
- Clear scoring with reasoning
- User agency via explicit save/score workflow

## Repository Structure

```
capstone-job-search-score/
├── app/
│   ├── api/
│   │   ├── chat/route.ts              # Job Discovery Agent
│   │   └── match/route.ts             # Job Matching Agent
│   └── page.tsx                        # Landing page
├── components/
│   ├── agent/
│   │   ├── prompts/
│   │   │   ├── job-discovery-prompt.ts
│   │   │   ├── job-matching-prompt.ts
│   │   │   └── index.ts
│   │   └── tools/
│   │       ├── adzuna.ts
│   │       ├── save-jobs.ts
│   │       ├── score-jobs.ts
│   │       └── index.ts
│   ├── ai-elements/                    # AI SDK UI components
│   ├── chat/                           # Chat interface (future)
│   └── ui/                             # shadcn/ui components
├── lib/
│   ├── mcp/                            # MCP client for Firecrawl
│   ├── storage/
│   │   ├── jobs.ts                     # Job storage utilities
│   │   └── profile.ts                  # Profile storage utilities
│   └── utils.ts
├── types/
│   ├── job.ts                          # Job interface + utilities
│   └── profile.ts                      # UserProfile interface + utilities
├── Specs/
│   └── planning_framework_complete.md  # Full project specification
├── CLAUDE.md                           # Development guidelines
├── PROJECT_SUMMARY.md                  # This file
├── README.md                           # Setup and usage
├── package.json
└── .env.local                          # API keys (not in repo)
```

## Credits

**Technologies:**
- Vercel AI SDK and AI Elements
- OpenAI GPT-5
- Firecrawl (via MCP)
- Adzuna API
- Next.js, React, TypeScript
- shadcn/ui, Tailwind CSS

**Framework inspiration:**
- Anthropic's AI SDK examples
- MCP protocol specification
- AI Elements component library

---

*Last updated: January 2025*
