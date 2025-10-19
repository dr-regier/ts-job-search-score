/**
 * Save Jobs Tool
 *
 * Allows the agent to save selected jobs to user's profile.
 * Saves directly to Supabase database via API route.
 */

import { z } from "zod";
import type { Job } from "@/types/job";

/**
 * Save Jobs to Profile Tool
 *
 * Saves selected jobs to the user's profile in Supabase database.
 * Makes API call to /api/jobs/save endpoint.
 */
export const saveJobsToProfile = {
  description:
    "Save selected jobs to the user's profile in the database. Use this ONLY when the user explicitly requests to save jobs (e.g., 'save the top 5', 'save jobs 2, 5, and 12', 'save all remote ones'). NEVER auto-save jobs without user request. Jobs must be marked with applicationStatus: 'saved'.",

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

    try {
      // Save jobs to Supabase via API route
      const response = await fetch('/api/jobs/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobs: savedJobs }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Failed to save jobs:', error);
        throw new Error(error.error || 'Failed to save jobs');
      }

      const result = await response.json();
      console.log(`✅ Successfully saved ${result.count} jobs to database`);

      return {
        action: "saved",
        savedJobs,
        savedIds: savedJobs.map((job) => job.id),
        count: savedJobs.length,
        criteria: criteria || "selected jobs",
        message: `Saved ${savedJobs.length} job${savedJobs.length === 1 ? "" : "s"}${criteria ? ` (${criteria})` : ""} to your profile`,
      };
    } catch (error) {
      console.error('💥 Save Jobs Tool error:', error);
      throw error;
    }
  },
};
