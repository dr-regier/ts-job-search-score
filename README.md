# AI Job Application Agent

An intelligent job search and matching system powered by multi-agent AI architecture. Automates job discovery across multiple sources and provides detailed fit analysis to help job seekers find their ideal positions.

## Features

### Multi-Agent AI System
- **Unified Multi-Agent Chat** - Single conversation interface with intelligent routing:
  - **Job Discovery Agent** - Autonomously searches jobs across company career pages and job boards
  - **Job Matching Agent** - Analyzes job fit with intelligent scoring and gap identification
  - **Intent Detection** - Automatically routes to appropriate agent based on user's message
  - **Seamless Coordination** - Both agents work in same conversation with merged message streams
- **Multi-Source Job Search** - Combines Firecrawl web scraping with Adzuna API for comprehensive coverage
- **Intelligent Job Scoring** - Weighted scoring system (0-100) with detailed reasoning and gap analysis
- **Natural Language Commands** - Find, save, and score jobs through conversation
- **AI Elements Components** - Rich UI components for tool calls, reasoning, and structured outputs

### User Interface
- **Profile Management** (`/profile`) - Create and edit your professional profile:
  - Comprehensive form with validation (name, background, skills, salary, locations)
  - Interactive scoring weight sliders (5 categories, must sum to 100%)
  - Real-time validation and visual feedback
  - Loads and pre-populates existing profile data
- **Jobs Dashboard** (`/jobs`) - Premium dashboard for job tracking and management:
  - Real-time metrics (total jobs, priority counts, average score, last updated)
  - Advanced filtering (by priority and status)
  - Multiple sorting options (score, date, company)
  - Status tracking per job (Saved → Applied → Interviewing → Offer/Rejected)
  - Animated UI with professional design quality
  - Empty states with helpful guidance
- **Navigation** - Unified header with easy access to Chat, Jobs, and Profile pages

### Technical Features
- **localStorage Persistence** - Save jobs and profiles without needing a database
- **TypeScript** - Full type safety across the entire application
- **shadcn/ui Design System** - Clean, modern UI components with custom animations
- **Responsive Design** - Mobile-first approach that scales beautifully to desktop
- **Form Validation** - react-hook-form with Zod schemas for type-safe forms

## Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Create `.env.local` file with required API keys:**

   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   FIRECRAWL_API_KEY=your_firecrawl_api_key_here
   ADZUNA_APP_ID=your_adzuna_app_id_here
   ADZUNA_API_KEY=your_adzuna_api_key_here
   ```

   **Where to get API keys:**
   - **OpenAI** - [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - **Firecrawl** - [https://firecrawl.dev](https://firecrawl.dev)
   - **Adzuna** - [https://developer.adzuna.com](https://developer.adzuna.com)

3. **Start development server:**
   ```bash
   pnpm dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** to start using the job search agent.

## Usage

### 1. Create Your Profile
Navigate to `/profile` or click "Profile" in the header:
- Fill out your professional information
- Set your salary range and preferred locations
- Add your skills and job preferences
- Configure scoring weights with interactive sliders (must sum to 100%)
- Save your profile

### 2. Discover Jobs (Chat Interface)
Go to the chat interface (`/`) and tell the agent what you're looking for:
- "Find AI engineering jobs at Google and Microsoft"
- "Search for remote product manager roles in fintech"
- "Show me senior software engineer positions in San Francisco"

### 3. Save Interesting Jobs
The agent finds jobs temporarily. Explicitly save the ones you like:
- "Save the top 5 jobs"
- "Save all remote positions"
- "Save jobs 2, 5, and 12"

### 4. Score Your Saved Jobs
Get detailed fit analysis in the same conversation:
- "Score my saved jobs"
- The agent analyzes each job against your profile with reasoning and gap identification
- Scores appear with detailed breakdowns and missing qualifications

### 5. Manage Your Applications
Navigate to the Jobs Dashboard (`/jobs`):
- View all saved jobs with scores and priorities
- Filter by priority (High/Medium/Low) or status
- Sort by score, date, or company
- Update job status as you progress (Saved → Applied → Interviewing → Offer/Rejected)
- Click "View" to see job posting or "Apply" to apply directly
- Track metrics: total jobs, priority counts, average score

## Resources

- [Next.js 15](https://nextjs.org/) - React framework
- [AI SDK 5](https://ai-sdk.dev/) - AI integration toolkit
- [AI Elements](https://ai-sdk.dev/elements/overview) - Pre-built AI components
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

## Architecture

### Multi-Agent System

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           Browser UI (Chat)                              │
│  - AI Elements components (Conversation, Message, Tool, Reasoning)       │
│  - useChat hook for streaming                                            │
│  - localStorage for persistence                                          │
└────────────┬────────────────────────────────────────┬────────────────────┘
             │                                        │
             │ 1) "Find jobs at Google"              │ 3) "Score my saved jobs"
             ↓                                        ↓
┌────────────────────────────────┐    ┌────────────────────────────────────┐
│   Job Discovery Agent          │    │    Job Matching Agent              │
│   /api/chat/route.ts           │    │    /api/match/route.ts             │
├────────────────────────────────┤    ├────────────────────────────────────┤
│ Tools:                         │    │ Tools:                             │
│  - Firecrawl MCP (scrape)      │    │  - Firecrawl MCP (research)        │
│  - Adzuna API                  │    │  - Web Search                      │
│  - Web Search                  │    │  - Score Jobs                      │
│  - Save Jobs                   │    │                                    │
├────────────────────────────────┤    ├────────────────────────────────────┤
│ Responsibilities:              │    │ Responsibilities:                  │
│  - Multi-source search         │    │  - Job fit analysis                │
│  - Autonomous decisions        │    │  - Weighted scoring (0-100)        │
│  - Result refinement           │    │  - Gap identification              │
│  - Present findings            │    │  - Priority assignment             │
└────────────┬───────────────────┘    └──────────────┬─────────────────────┘
             │                                       │
             │ 2) Save jobs                          │ 4) Update with scores
             ↓                                       ↓
        ┌─────────────────────────────────────────────────┐
        │         localStorage (Shared State)             │
        │  - User Profile                                 │
        │  - Saved Jobs (with/without scores)             │
        └─────────────────────────────────────────────────┘

Key Features:
- **Unified interface**: Both agents accessible in single conversation
- **Intelligent routing**: Keywords like 'score', 'analyze', 'match' trigger Matching Agent
- **Message merging**: Chronologically combined streams from both agents
- **Context-aware**: Checks for saved jobs and profile before routing
- **Graceful fallbacks**: Handles missing data with helpful messages
- Communication via localStorage (shared state)
```

### Data Flow

1. **Job Discovery** → Jobs discovered and displayed temporarily in chat
2. **Explicit Save** → User selects which jobs to save to localStorage
3. **Job Matching** → Agent reads saved jobs, analyzes fit, returns scores
4. **Persistence** → Updated jobs with scores saved to localStorage
