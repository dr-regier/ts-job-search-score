/**
 * Display Jobs Tool
 *
 * Pass-through tool that allows the agent to display structured job data
 * in the carousel. This is used after parsing jobs from any source
 * (Firecrawl scrapes, manual extraction, etc.).
 */

import { z } from "zod";
import type { Job } from "@/types/job";

/**
 * Display Jobs Tool
 *
 * Accepts an array of structured Job objects and formats them for carousel display.
 * The agent should call this after extracting/parsing job listings from any source.
 */
export const displayJobs = {
  description:
    "Display structured job listings in the carousel. Call this tool after you have parsed and structured job data from any source (Firecrawl scrapes, web searches, etc.). Pass the array of Job objects to show them to the user in an interactive carousel.",

  inputSchema: z.object({
    jobs: z
      .array(
        z.object({
          id: z.string().describe("Unique job identifier (UUID)"),
          title: z.string().describe("Job title"),
          company: z.string().describe("Company name"),
          location: z.string().describe("Job location"),
          salary: z.string().optional().describe("Salary range or amount"),
          description: z.string().describe("Full job description"),
          requirements: z
            .array(z.string())
            .describe("List of job requirements/qualifications"),
          url: z.string().describe("Link to job posting"),
          source: z
            .enum(["firecrawl", "adzuna", "manual"])
            .describe("Source of the job listing"),
          discoveredAt: z.string().describe("ISO timestamp when job was discovered"),
        })
      )
      .describe("Array of structured job objects to display"),
  }),

  execute: async ({ jobs }: { jobs: Job[] }) => {
    const startTime = performance.now();
    console.log(`📺 Display Jobs Tool called with ${jobs.length} jobs`);

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      console.warn("⚠️  Display Jobs called with empty or invalid jobs array");
      return {
        action: "error",
        error: "No jobs provided to display",
        jobs: [],
      };
    }

    // Validate that each job has required fields
    const validJobs = jobs.filter((job) => {
      const isValid =
        job.id &&
        job.title &&
        job.company &&
        job.location &&
        job.description &&
        job.url;

      if (!isValid) {
        console.warn("⚠️  Invalid job object:", job);
      }

      return isValid;
    });

    const endTime = performance.now();
    const executionTime = (endTime - startTime).toFixed(2);

    console.log(`✅ Display Jobs completed in ${executionTime}ms - returning ${validJobs.length} valid jobs`);

    return {
      action: "display",
      jobs: validJobs,
      count: validJobs.length,
      message: `Displaying ${validJobs.length} jobs in carousel`,
    };
  },
};
