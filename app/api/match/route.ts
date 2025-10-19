/**
 * Job Matching Agent API Route
 *
 * Handles job scoring and fit analysis requests.
 * Agent analyzes saved jobs against user profile, generates scores with
 * detailed reasoning, identifies gaps, and assigns priority levels.
 */

import { JOB_MATCHING_SYSTEM_PROMPT } from "@/components/agent/prompts";
import { scoreJobsTool } from "@/components/agent/tools";
import { getFirecrawlMCPClient } from "@/lib/mcp";
import { createClient } from "@/lib/supabase/server";
import { getJobs, getProfile } from "@/lib/supabase/queries";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase auth
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Authentication failed');
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await request.json();

    // Fetch jobs and profile from Supabase
    const jobs = await getJobs(supabase, user.id);
    const profile = await getProfile(supabase, user.id);

    console.log('\n' + '═'.repeat(60));
    console.log('📊 JOB MATCHING AGENT ACTIVATED');
    console.log('═'.repeat(60));

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log('❌ Validation failed: Messages array is required');
      return new Response("Messages array is required", { status: 400 });
    }

    if (!profile) {
      console.log('❌ Validation failed: User profile is required');
      return new Response(
        "User profile is required for job matching. Please complete your profile first.",
        { status: 400 }
      );
    }

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      console.log('❌ Validation failed: Jobs array is required');
      return new Response(
        "Jobs array is required. Please save some jobs before requesting scoring.",
        { status: 400 }
      );
    }

    console.log(`✅ Validation passed:`);
    console.log(`   - Profile: ${profile.name || 'Anonymous'}`);
    console.log(`   - Jobs to analyze: ${jobs.length}`);
    console.log(`   - User messages: ${messages.length}`);

    const modelMessages = convertToModelMessages(messages);

    // Initialize Firecrawl MCP client (for company research during scoring)
    console.log(
      "🚀 Initializing Firecrawl MCP client for Job Matching Agent..."
    );
    const firecrawlClient = getFirecrawlMCPClient();
    await firecrawlClient.connect();

    // Retrieve Firecrawl MCP tools
    const firecrawlTools = await firecrawlClient.getTools();

    console.log(
      `🔧 Job Matching Agent has access to ${Object.keys(firecrawlTools).length} Firecrawl MCP tools`
    );

    const cookieHeader = request.headers.get("cookie") ?? undefined;

    // Wrap Firecrawl tools to log when they are called
    const wrappedFirecrawlTools = Object.fromEntries(
      Object.entries(firecrawlTools).map(([toolName, toolDef]) => [
        toolName,
        {
          ...toolDef,
          execute: async (args: any) => {
            console.log(`\n🔧 Firecrawl Tool called: ${toolName}`);
            console.log(`   Input:`, JSON.stringify(args, null, 2));
            const result = await toolDef.execute(args);
            console.log(`   Output:`, JSON.stringify(result, null, 2));
            return result;
          },
        },
      ])
    );

    // Wrap scoreJobsTool to log when called
    const wrappedScoreTool = {
      ...scoreJobsTool,
      execute: async (args: any) => {
        console.log(`\n🔧 Custom Tool called: scoreJobsTool`);
        console.log(`   Input:`, JSON.stringify(args, null, 2));
        const result = await scoreJobsTool.execute(args, { cookie: cookieHeader });
        console.log(`   Output:`, JSON.stringify(result, null, 2));
        return result;
      },
    };

    // Combine tools
    const allTools = {
      ...wrappedFirecrawlTools,
      scoreJobsTool: wrappedScoreTool,
    };

    console.log(
      `✅ Total tools available: ${Object.keys(allTools).length} (${Object.keys(firecrawlTools).length} Firecrawl + 1 custom)`
    );

    // Inject jobs and profile into system prompt context
    const systemPromptWithContext = `${JOB_MATCHING_SYSTEM_PROMPT}

## USER PROFILE CONTEXT

The user's profile information is provided below. Use this to analyze job fit:

\`\`\`json
${JSON.stringify(profile, null, 2)}
\`\`\`

## JOBS TO SCORE

The following jobs have been saved by the user and need to be scored:

\`\`\`json
${JSON.stringify(jobs, null, 2)}
\`\`\`

## YOUR TASK

Analyze each job against the user's profile. Calculate weighted scores based on the user's scoring weights. Provide detailed reasoning for each score. Identify gaps honestly. Assign priority levels. Return results using the scoreJobsTool.`;

    console.log('\n' + '─'.repeat(60));
    console.log(`📊 Starting job analysis:`);
    console.log(`   - Analyzing ${jobs.length} job(s) against user profile`);
    console.log(`   - Scoring weights: Salary ${profile.scoringWeights?.salaryMatch || 30}%, Location ${profile.scoringWeights?.locationFit || 20}%, Company ${profile.scoringWeights?.companyAppeal || 25}%, Role ${profile.scoringWeights?.roleMatch || 15}%, Requirements ${profile.scoringWeights?.requirementsFit || 10}%`);
    console.log(`   - Model: GPT-5 with medium reasoning effort`);
    console.log(`   - Max steps: 5`);
    console.log('─'.repeat(60) + '\n');

    const result = streamText({
      model: openai("gpt-5"),
      system: systemPromptWithContext,
      messages: modelMessages,
      tools: allTools,
      stopWhen: stepCountIs(5), // Shorter loop for focused analysis
      providerOptions: {
        openai: {
          reasoning_effort: "medium", // More thorough analysis for scoring
          textVerbosity: "low",
          reasoningSummary: "detailed",
        },
      },
    });

    console.log('✅ Matching Agent response stream started successfully\n');
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('\n' + '═'.repeat(60));
    console.error("💥 JOB MATCHING AGENT ERROR");
    console.error('═'.repeat(60));
    console.error(error);
    console.error('═'.repeat(60) + '\n');
    return new Response("Failed to generate response", { status: 500 });
  }
}
