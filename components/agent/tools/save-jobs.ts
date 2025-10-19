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

  execute: async (
    { jobs, criteria }: { jobs: any[]; criteria?: string },
    context?: { cookie?: string }
  ) => {
    console.log(`💾 Save Jobs Tool called for ${jobs.length} job(s)`);

    if (criteria) {
      console.log(`   Selection criteria: ${criteria}`);
    }

    // Mark all jobs as saved
    const jobsToSave: Job[] = jobs.map((job: any) => ({
      ...job,
      applicationStatus: "saved" as const,
      statusUpdatedAt: new Date().toISOString(),
    }));

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

      // Save jobs to Supabase via API route (needs absolute URL when running server-side)
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (context?.cookie) {
        headers.Cookie = context.cookie;
      }

      const response = await fetch(new URL("/api/jobs/save", baseUrl), {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ jobs: jobsToSave }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Failed to save jobs:', error);
        throw new Error(error.error || 'Failed to save jobs');
      }

      const result = await response.json();
      const persistedJobs: Job[] = result.jobs || jobsToSave;
      console.log(`✅ Successfully saved ${persistedJobs.length} jobs to database`);

      return {
        action: "saved",
        savedJobs: persistedJobs,
        savedIds: persistedJobs.map((job) => job.id),
        count: persistedJobs.length,
        criteria: criteria || "selected jobs",
        message: `Saved ${persistedJobs.length} job${persistedJobs.length === 1 ? "" : "s"}${criteria ? ` (${criteria})` : ""} to your profile`,
      };
    } catch (error) {
      console.error('💥 Save Jobs Tool error:', error);
      throw error;
    }
  },
};
