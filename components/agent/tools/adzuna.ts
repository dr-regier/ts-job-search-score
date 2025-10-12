/**
 * Adzuna API Tool
 *
 * Searches for jobs using the Adzuna Job Search API.
 * Returns jobs with action: "display" for temporary viewing.
 */

import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import type { Job } from "@/types/job";

/**
 * Adzuna API response interfaces
 */
interface AdzunaJob {
  id: string;
  title: string;
  company: {
    display_name: string;
  };
  location: {
    display_name: string;
    area?: string[];
  };
  description: string;
  salary_min?: number;
  salary_max?: number;
  redirect_url: string;
  category?: {
    label: string;
  };
  contract_type?: string;
  created?: string;
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
  mean?: number;
}

/**
 * Maps Adzuna job to our Job interface
 */
function mapAdzunaJobToJob(adzunaJob: AdzunaJob): Job {
  // Extract requirements from description (simple heuristic)
  const requirements: string[] = [];
  const descLower = adzunaJob.description.toLowerCase();

  // Look for common requirement indicators
  if (descLower.includes("bachelor") || descLower.includes("degree")) {
    requirements.push("Bachelor's degree or equivalent experience");
  }
  if (descLower.includes("experience")) {
    requirements.push("Relevant professional experience");
  }

  // Format salary if available
  let salary: string | undefined;
  if (adzunaJob.salary_min && adzunaJob.salary_max) {
    salary = `$${adzunaJob.salary_min.toLocaleString()} - $${adzunaJob.salary_max.toLocaleString()}`;
  } else if (adzunaJob.salary_min) {
    salary = `$${adzunaJob.salary_min.toLocaleString()}+`;
  }

  return {
    id: uuidv4(),
    title: adzunaJob.title,
    company: adzunaJob.company.display_name,
    location: adzunaJob.location.display_name,
    salary,
    description: adzunaJob.description,
    requirements,
    url: adzunaJob.redirect_url,
    source: "adzuna",
    discoveredAt: new Date().toISOString(),
  };
}

/**
 * Adzuna Job Search Tool
 *
 * Searches for jobs across multiple companies using the Adzuna API.
 */
export const searchAdzunaJobs = {
  description:
    "Search for jobs using the Adzuna job search API. Returns jobs from multiple companies and job boards. Use this for broad job searches or when the user doesn't specify particular companies. Results are displayed temporarily and must be explicitly saved by the user.",

  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Job search query (e.g., 'AI engineer', 'product manager fintech', 'senior software engineer')"
      ),
    location: z
      .string()
      .optional()
      .describe(
        "Location filter (e.g., 'San Francisco', 'Remote', 'United States'). Leave empty for all locations."
      ),
    resultsCount: z
      .number()
      .min(1)
      .max(50)
      .default(20)
      .describe("Number of results to return (max 50, default 20)"),
  }),

  execute: async ({ query, location, resultsCount = 20 }: { query: string; location?: string; resultsCount?: number }) => {
    console.log(`🔍 Adzuna Tool called with query: "${query}"`);

    // Get API credentials from environment
    const appId = process.env.ADZUNA_APP_ID;
    const apiKey = process.env.ADZUNA_APP_KEY;

    if (!appId || !apiKey) {
      console.error("❌ Adzuna API credentials not found");
      return {
        action: "error",
        error: "Adzuna API credentials are not configured. Please add ADZUNA_APP_ID and ADZUNA_API_KEY to your environment variables.",
        jobs: [],
      };
    }

    try {
      // Build API URL
      const baseUrl = "https://api.adzuna.com/v1/api/jobs/us/search/1";
      const params = new URLSearchParams({
        app_id: appId,
        app_key: apiKey,
        results_per_page: resultsCount.toString(),
        what: query,
      });

      if (location) {
        params.append("where", location);
      }

      const url = `${baseUrl}?${params.toString()}`;

      console.log(`📡 Fetching from Adzuna API...`);

      // Make API request
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(`❌ Adzuna API error: ${response.status} ${response.statusText}`);
        return {
          action: "error",
          error: `Adzuna API returned error: ${response.status} ${response.statusText}`,
          jobs: [],
        };
      }

      const data: AdzunaResponse = await response.json();

      console.log(`✅ Adzuna returned ${data.results.length} jobs`);

      // Map Adzuna jobs to our Job interface
      const jobs: Job[] = data.results.map(mapAdzunaJobToJob);

      return {
        action: "display",
        jobs,
        count: jobs.length,
        query,
        location: location || "all locations",
        message: `Found ${jobs.length} jobs matching "${query}"${location ? ` in ${location}` : ""}`,
      };
    } catch (error) {
      console.error("💥 Adzuna tool error:", error);

      return {
        action: "error",
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while searching Adzuna",
        jobs: [],
      };
    }
  },
};
