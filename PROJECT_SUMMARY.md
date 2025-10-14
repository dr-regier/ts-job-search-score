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
- **Forms**: react-hook-form 7.65+ with @hookform/resolvers and Zod validation
- **State Management**: localStorage (no database/authentication)
- **Build Tools**: Turbopack, pnpm
- **Icons**: Lucide React

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

### 4. Unified Multi-Agent Chat Interface
- **Dual-agent coordination**: Single conversation interface with both Discovery and Matching agents
- **Intelligent routing**: Automatic agent selection based on user intent detection
- **Intent keywords**: 'score', 'analyze', 'match', 'fit', 'rate', 'evaluate', 'assess', 'rank', 'priority', 'compare'
- **Message merging**: Chronologically combined messages from both agents
- **Context-aware**: Routes to Matching Agent when scoring keywords detected + saved jobs exist
- **Graceful fallbacks**: Handles missing profile or no saved jobs scenarios
- Built with AI Elements (Vercel's pre-built AI UI components)
- Streaming responses with visible tool execution
- Reasoning tokens displayed as collapsible blocks
- Natural language interaction for all operations

### 5. Profile Management UI
- **Form-based profile creation** (`/profile`):
  - Comprehensive ProfileForm component with react-hook-form + Zod validation
  - Fields: Name, Professional Background (min 10 chars), Skills (comma-separated)
  - Salary range with validation (min < max)
  - Preferred locations and job preferences
  - Deal breakers (textarea)
- **Interactive ScoringWeights component**:
  - 5 slider inputs for scoring categories (Salary, Location, Company, Role, Requirements)
  - Real-time validation (must sum to 100%)
  - Visual indicator: green when valid, red when invalid
  - Range: 0-100, step: 5
- **Loads existing profile** from localStorage with pre-population
- **Success messages** and indicators if profile was created via chat
- **createdVia** field tracks profile origin ("chat" | "form")

### 6. Jobs Dashboard
- **Premium dashboard UI** (`/jobs`) with professional design quality:
  - **HeroSection**: Animated gradient banner (blue → purple → blue)
  - **ActionCards**: 4 quick-action cards with hover effects and navigation
  - **DashboardMetrics**: 5 metric cards with real-time calculations
    - Total Jobs, High Priority, Medium Priority, Average Score, Last Updated
    - Color-coded numbers with icons
    - Staggered fade-in animations
  - **JobTable**: Advanced table with filtering and sorting
    - Filters: Priority (All/High/Medium/Low), Status (All/Saved/Applied/Interviewing/Offer/Rejected)
    - Sorting: Score (High/Low), Date (Newest/Oldest), Company (A-Z)
    - Large color-coded score display per job
    - Priority badges (pill-shaped, color-coded)
    - Status dropdown per row with localStorage sync
    - Action buttons: View (external link), Apply (external link)
    - Empty state with helpful message and CTA
    - Results counter
  - **ScoreBreakdown component**: Circular score indicator with animated progress bars
  - **JobCard component**: Premium card design with saved/unsaved states
- **Custom animations** in `app/globals.css`:
  - gradient-x (3s ease infinite)
  - fade-in (0.5s ease-out)
  - slide-up (0.5s ease-out)
  - pulse-soft (2s ease-in-out infinite)
- **Responsive design**: Mobile-first with breakpoints for tablet and desktop

### 7. Navigation & Layout
- **Header component** with unified navigation
- Links to Chat (`/`), Jobs (`/jobs`), Profile (`/profile`)
- Active page highlighting
- Icons: Home (Briefcase), Jobs (Briefcase), Profile (User)
- Consistent across all pages

### 8. Data Persistence
- **localStorage-based**: No database or authentication required
- **User Profile**: Skills, salary range, preferences, scoring weights, createdVia
- **Jobs**: Discovered jobs with optional scores and application status
- **Auto-refresh**: State updates after agent actions complete
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
- `react-hook-form` (7.65+): Form state management with validation
- `@hookform/resolvers`: Integration between react-hook-form and validation libraries
- `uuid`: Unique job ID generation
- `zod` (4.1.11): Schema validation for tool inputs and forms
- `next` (15.5.3): React framework with App Router
- `react` (19.1.0): UI library
- `tailwindcss` (v4): Styling with custom animations
- `shadcn/ui`: Component library (Radix UI primitives)
- `lucide-react`: Icon library

## Technical Achievements

### 1. Multi-Agent Architecture with Unified Interface
- Designed two specialized agents with distinct responsibilities
- Implemented **dual `useChat` hooks** in single component for seamless coordination
- **Intelligent routing system** with keyword-based intent detection
- **Message stream merging** using React.useMemo for chronological display
- Indirect coordination via shared state (localStorage)
- Demonstrated autonomous decision-making within each agent's domain
- Clear separation of concerns (discovery vs. analysis)
- Graceful handling of edge cases (no profile, no saved jobs)

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
- **Form-based profile management** with react-hook-form + Zod validation
- **Premium dashboard design** with animated components and professional polish
- **Interactive filtering and sorting** with real-time updates
- **Status tracking** with dropdown selects and localStorage sync
- **Custom animations** (gradient-x, fade-in, slide-up, pulse-soft)
- **Responsive design** with mobile-first approach

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

### Completed
- ✅ Profile form UI for manual editing
- ✅ Jobs dashboard with table view
- ✅ Application status tracking UI
- ✅ Filtering and sorting capabilities
- ✅ Real-time metrics display

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
│   ├── jobs/
│   │   └── page.tsx                    # Jobs Dashboard page
│   ├── profile/
│   │   └── page.tsx                    # Profile management page
│   ├── page.tsx                        # Landing page (chat)
│   └── globals.css                     # Global styles with custom animations
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
│   ├── chat/
│   │   └── chat-assistant.tsx          # Multi-agent chat interface
│   ├── jobs/                           # Jobs Dashboard components
│   │   ├── ActionCards.tsx
│   │   ├── DashboardMetrics.tsx
│   │   ├── HeroSection.tsx
│   │   ├── JobCard.tsx
│   │   ├── JobTable.tsx
│   │   └── ScoreBreakdown.tsx
│   ├── layout/                         # Layout components
│   │   └── Header.tsx                  # Navigation header
│   ├── profile/                        # Profile management components
│   │   ├── ProfileForm.tsx
│   │   └── ScoringWeights.tsx
│   └── ui/                             # shadcn/ui components
├── lib/
│   ├── mcp/                            # MCP client for Firecrawl
│   ├── storage/
│   │   ├── jobs.ts                     # Job storage utilities
│   │   ├── profile.ts                  # Profile storage utilities
│   │   └── index.ts                    # Storage exports barrel
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

## Implementation Highlights

### Multi-Agent Chat Interface (`components/chat/chat-assistant.tsx`)

**Dual useChat Hooks:**
```typescript
// Discovery Agent
const discoveryChat = useChat({
  transport: api ? new DefaultChatTransport({ api }) : undefined,
  onFinish: () => setSavedJobs(getJobs()),
});

// Matching Agent
const matchingChat = useChat({
  transport: new DefaultChatTransport({
    api: '/api/match',
    body: { jobs: savedJobs, profile: userProfile },
  }),
  onFinish: () => setSavedJobs(getJobs()),
});
```

**Intelligent Intent Detection:**
```typescript
const detectScoringIntent = (text: string): boolean => {
  const keywords = ['score', 'analyze', 'match', 'fit', 'rate',
                    'evaluate', 'assess', 'rank', 'priority', 'compare'];
  return keywords.some(keyword => text.toLowerCase().includes(keyword));
};
```

**Message Stream Merging:**
```typescript
const allRawMessages = React.useMemo(() => {
  const discovery = discoveryChat.messages.map(msg => ({
    ...msg, agentSource: 'discovery' as const
  }));
  const matching = matchingChat.messages.map(msg => ({
    ...msg, agentSource: 'matching' as const
  }));
  return [...discovery, ...matching].sort((a, b) =>
    a.id.localeCompare(b.id)
  );
}, [discoveryChat.messages, matchingChat.messages]);
```

**Smart Routing Logic:**
- Scoring intent + saved jobs + profile → Matching Agent
- Scoring intent + no saved jobs → Discovery Agent (helpful message)
- Scoring intent + no profile → Discovery Agent (profile creation prompt)
- All other queries → Discovery Agent (default)

**Lines of Code:** ~140 net lines added for full multi-agent coordination

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
