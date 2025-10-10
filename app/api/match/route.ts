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
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { NextRequest } from "next/server";
import type { Job } from "@/types/job";
import type { UserProfile } from "@/types/profile";

export async function POST(request: NextRequest) {
  try {
    const { messages, jobs, profile } = await request.json();

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Messages array is required", { status: 400 });
    }

    if (!profile) {
      return new Response(
        "User profile is required for job matching. Please complete your profile first.",
        { status: 400 }
      );
    }

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return new Response(
        "Jobs array is required. Please save some jobs before requesting scoring.",
        { status: 400 }
      );
    }

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
        const result = await scoreJobsTool.execute(args);
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

    console.log(
      `📊 Matching Agent analyzing ${jobs.length} job(s) against user profile...`
    );

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

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("💥 Job Matching Agent API error:", error);
    return new Response("Failed to generate response", { status: 500 });
  }
}
