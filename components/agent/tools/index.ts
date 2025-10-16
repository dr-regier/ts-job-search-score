/**
 * Agent Tools Index
 *
 * Central export point for all custom AI SDK tools.
 * Import tools from this file to use in agent API routes.
 */

export { searchAdzunaJobs } from "./adzuna";
export { saveJobsToProfile } from "./save-jobs";
export { scoreJobsTool } from "./score-jobs";
export { generateTailoredResumeTool, getResumeGenerationContext } from "./generate-resume";

/**
 * Combined tools object for easy import
 *
 * Usage:
 *   import { agentTools } from "@/components/agent/tools";
 *   const result = streamText({ tools: agentTools, ... });
 */
import { searchAdzunaJobs } from "./adzuna";
import { saveJobsToProfile } from "./save-jobs";
import { scoreJobsTool } from "./score-jobs";
import { generateTailoredResumeTool } from "./generate-resume";

export const agentTools = {
  searchAdzunaJobs,
  saveJobsToProfile,
  scoreJobsTool,
  generateTailoredResumeTool,
};
