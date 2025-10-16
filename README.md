# AI Job Application Agent

An intelligent job search and matching system powered by multi-agent AI architecture. Automates job discovery across multiple sources and provides detailed fit analysis to help job seekers find their ideal positions.

## Features

### Multi-Agent AI System
- **Unified Multi-Agent Chat** - Single conversation interface with intelligent routing:
  - **Job Discovery Agent** - Autonomously searches jobs across company career pages and job boards
  - **Job Matching Agent** - Analyzes job fit with intelligent scoring and gap identification
  - **Resume Generator Agent** - AI-powered resume tailoring for specific job opportunities
  - **Intent Detection** - Automatically routes to appropriate agent based on user's message
  - **Seamless Coordination** - Multiple agents work in same conversation with merged message streams
  - **Chat Persistence** - Conversation history persists across page navigation (in-memory via React Context)
  - **Clear Chat** - Reset conversation with confirmation dialog while preserving saved jobs and profile
- **Multi-Source Job Search** - Combines Firecrawl web scraping with Adzuna API for comprehensive coverage
- **Intelligent Job Scoring** - Weighted scoring system (0-100) with detailed reasoning and gap analysis
- **AI-Powered Resume Tailoring** - Generate customized resumes for specific jobs using GPT-5
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
  - **Generate Resume** button (✨) - Create tailored resumes for specific jobs
  - Job removal with confirmation dialog (permanently delete unwanted jobs)
  - Animated UI with professional design quality
  - Empty states with helpful guidance
- **Resume Library** (`/resumes`) - Upload and manage your resumes:
  - Upload markdown or text files (max 50KB)
  - Grid view of all your resumes with preview (first 200 characters)
  - View full resume content in modal
  - Edit resume name and content
  - Delete resumes with confirmation
  - Automatic section parsing (summary, experience, skills, education)
  - Clean, professional design matching Profile page
- **AI Resume Generation** - Accessible from Jobs dashboard:
  - Select a master resume to tailor for a specific job
  - AI analyzes job requirements and reorders resume content
  - Shows match analysis with alignment score and addressed requirements
  - Documents all changes (reordering, keyword integration, emphasis)
  - Identifies remaining gaps with recommendations
  - Copy to clipboard or download as .md file
  - Uses GPT-5 with reasoning_effort: 'medium' for quality output
- **Navigation** - Unified header with easy access to Chat, Jobs, Resumes, and Profile pages

### Technical Features
- **localStorage Persistence** - Save jobs, profiles, and resumes without needing a database
- **TypeScript** - Full type safety across the entire application
- **shadcn/ui Design System** - Clean, modern UI components with custom animations
- **Responsive Design** - Mobile-first approach that scales beautifully to desktop
- **Form Validation** - react-hook-form with Zod schemas for type-safe forms
- **File Upload** - Support for markdown and text resume files with validation
- **GPT-5 Integration** - Advanced AI reasoning for resume tailoring with reasoning_effort: 'medium'

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

**Tip**: Use the "Clear Chat" button (with refresh icon) at the top to start a new conversation. This resets the chat history while keeping your saved jobs and profile.

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

### 5. Upload Your Resumes
Navigate to the Resume Library (`/resumes`):
- Upload your master resumes (markdown or text files, max 50KB)
- View and edit your resumes
- Keep multiple versions for different job types

### 6. Generate Tailored Resumes
From the Jobs Dashboard (`/jobs`):
- Click the ✨ sparkles icon on any job
- Select a master resume to customize
- AI generates a tailored version emphasizing relevant experience
- View match analysis, changes made, and alignment score
- Copy to clipboard or download as .md file

### 7. Manage Your Applications
Navigate to the Jobs Dashboard (`/jobs`):
- View all saved jobs with scores and priorities
- Filter by priority (High/Medium/Low) or status
- Sort by score, date, or company
- Update job status as you progress (Saved → Applied → Interviewing → Offer/Rejected)
- **Remove unwanted jobs** - Click the trash icon to permanently delete a job (with confirmation)
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
│                        Browser UI (Chat + Pages)                         │
│  - AI Elements components (Conversation, Message, Tool, Reasoning)       │
│  - useChat hook for streaming                                            │
│  - localStorage for persistence                                          │
└───┬────────────────────────────┬─────────────────────────┬───────────────┘
    │                            │                         │
    │ 1) "Find jobs"             │ 3) "Score jobs"         │ 5) ✨ Generate Resume
    ↓                            ↓                         ↓
┌────────────────────┐  ┌────────────────────┐  ┌─────────────────────────┐
│ Job Discovery      │  │ Job Matching       │  │ Resume Generator        │
│ /api/chat          │  │ /api/match         │  │ /api/resume             │
├────────────────────┤  ├────────────────────┤  ├─────────────────────────┤
│ Tools:             │  │ Tools:             │  │ Tools:                  │
│ - Firecrawl MCP    │  │ - Firecrawl MCP    │  │ - Firecrawl MCP         │
│ - Adzuna API       │  │ - Web Search       │  │ - Web Search            │
│ - Web Search       │  │ - Score Jobs       │  │ - Generate Resume       │
│ - Save Jobs        │  │                    │  │                         │
├────────────────────┤  ├────────────────────┤  ├─────────────────────────┤
│ Responsibilities:  │  │ Responsibilities:  │  │ Responsibilities:       │
│ - Multi-source     │  │ - Job fit analysis │  │ - Resume analysis       │
│ - Autonomous       │  │ - Weighted scoring │  │ - Content reordering    │
│ - Result refine    │  │ - Gap identify     │  │ - Keyword integration   │
│ - Present findings │  │ - Priority assign  │  │ - Authenticity rules    │
└──────┬─────────────┘  └──────┬─────────────┘  └──────┬──────────────────┘
       │                       │                        │
       │ 2) Save               │ 4) Update scores       │ 6) Return tailored
       ↓                       ↓                        ↓
   ┌───────────────────────────────────────────────────────────────┐
   │              localStorage (Shared State)                      │
   │  - User Profile                                               │
   │  - Saved Jobs (with/without scores)                           │
   │  - Master Resumes                                             │
   └───────────────────────────────────────────────────────────────┘

Key Features:
- **Three specialized agents**: Discovery, Matching, Resume Generator
- **Unified interface**: Chat agents accessible in single conversation
- **React Context state**: Chat persists across navigation via ChatContext
- **Intelligent routing**: Keywords trigger appropriate agent
- **Message merging**: Chronologically combined streams
- **Context-aware**: Checks for required data before routing
- **Resume tailoring**: AI analyzes job requirements and reorders content
- **Authenticity**: Never fabricates experience, only reorders and emphasizes
- Communication via localStorage (shared state)
```

### Data Flow

1. **Job Discovery** → Jobs discovered and displayed temporarily in chat
2. **Explicit Save** → User selects which jobs to save to localStorage
3. **Job Matching** → Agent reads saved jobs, analyzes fit, returns scores
4. **Persistence** → Updated jobs with scores saved to localStorage
