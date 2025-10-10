/**
 * Save Jobs Tool
 *
 * Allows the agent to save selected jobs to user's profile.
 * Returns data for client-side handler to write to localStorage.
 */

import { z } from "zod";
import type { Job } from "@/types/job";

/**
 * Save Jobs to Profile Tool
 *
 * Saves selected jobs to the user's profile (localStorage).
 * The agent returns saved job data, and the client-side handler
 * actually performs the localStorage write operation.
 */
export const saveJobsToProfile = {
  description:
    "Save selected jobs to the user's profile. Use this ONLY when the user explicitly requests to save jobs (e.g., 'save the top 5', 'save jobs 2, 5, and 12', 'save all remote ones'). NEVER auto-save jobs without user request. Jobs must be marked with applicationStatus: 'saved' and will persist in localStorage.",

  inputSchema: z.object({
    jobs: z
      .array(
        z.object({
          id: z.string().describe("Unique job ID"),
          title: z.string(),
          company: z.string(),
          location: z.string(),
          salary: z.string().optional(),
          description: z.string(),
          requirements: z.array(z.string()),
          url: z.string(),
          source: z.enum(["firecrawl", "adzuna", "manual"]),
          discoveredAt: z.string(),
        })
      )
      .min(1)
      .describe("Array of job objects to save"),

    criteria: z
      .string()
      .optional()
      .describe(
        "Description of how jobs were selected (e.g., 'top 5 by relevance', 'all remote positions', 'jobs 2, 5, and 12')"
      ),
  }),

  execute: async ({ jobs, criteria }: { jobs: any[]; criteria?: string }) => {
    console.log(`💾 Save Jobs Tool called for ${jobs.length} job(s)`);

    if (criteria) {
      console.log(`   Selection criteria: ${criteria}`);
    }

    // Mark all jobs as saved
    const savedJobs: Job[] = jobs.map((job: any) => ({
      ...job,
      applicationStatus: "saved" as const,
      statusUpdatedAt: new Date().toISOString(),
    }));

    // Extract IDs for easy reference
    const savedIds = savedJobs.map((job) => job.id);

    console.log(`✅ Prepared ${savedJobs.length} jobs for saving`);
    console.log(`   Job IDs: ${savedIds.join(", ")}`);

    return {
      action: "saved",
      savedJobs,
      savedIds,
      count: savedJobs.length,
      criteria: criteria || "selected jobs",
      message: `Saved ${savedJobs.length} job${savedJobs.length === 1 ? "" : "s"}${criteria ? ` (${criteria})` : ""} to your profile`,
    };
  },
};
