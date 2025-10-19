/**
 * Score Jobs Tool
 *
 * Allows the Job Matching Agent to return scored jobs with analysis.
 * Returns data for client-side handler to update localStorage.
 */

import { z } from "zod";

/**
 * Score Jobs Tool
 *
 * Used by the Job Matching Agent to return scored jobs with detailed analysis.
 * The agent calculates scores through LLM reasoning and returns the enriched data.
 * The client-side handler updates localStorage with the score information.
 */
export const scoreJobsTool = {
  description:
    "Return scored jobs with detailed fit analysis. Use this to provide job scores with breakdowns by category (salary, location, company, role, requirements), reasoning for the score, identified gaps, and priority level. Only score saved jobs - reject requests to score unsaved/temporary jobs.",

  inputSchema: z.object({
    scoredJobs: z
      .array(
        z.object({
          id: z.string().describe("Job ID"),
          score: z
            .number()
            .min(0)
            .max(100)
            .describe("Overall fit score (0-100)"),
          scoreBreakdown: z
            .object({
              salaryMatch: z
                .number()
                .describe("Points for salary match (out of user's weight)"),
              locationFit: z
                .number()
                .describe("Points for location fit (out of user's weight)"),
              companyAppeal: z
                .number()
                .describe("Points for company appeal (out of user's weight)"),
              roleMatch: z
                .number()
                .describe("Points for role match (out of user's weight)"),
              requirementsFit: z
                .number()
                .describe("Points for requirements fit (out of user's weight)"),
            })
            .describe("Breakdown of score by category"),
          reasoning: z
            .string()
            .describe(
              "Natural language explanation of the score and why this job is or isn't a good fit"
            ),
          gaps: z
            .array(z.string())
            .describe(
              "List of missing qualifications or skill gaps that prevent a perfect score"
            ),
          priority: z
            .enum(["high", "medium", "low"])
            .describe(
              "Priority level: high (≥85), medium (70-84), low (<70)"
            ),
        })
      )
      .min(1)
      .describe("Array of scored jobs with analysis"),
  }),

  execute: async (
    { scoredJobs }: { scoredJobs: any[] },
    context?: { cookie?: string }
  ) => {
    console.log(`🎯 Score Jobs Tool called for ${scoredJobs.length} job(s)`);

    // Log score summary
    scoredJobs.forEach((job: any) => {
      console.log(`   Job ID ${job.id}: ${job.score}/100 (${job.priority} priority)`);
    });

    // Calculate average score
    const avgScore =
      scoredJobs.reduce((sum: number, job: any) => sum + job.score, 0) / scoredJobs.length;

    // Count by priority
    const priorityCounts = {
      high: scoredJobs.filter((j: any) => j.priority === "high").length,
      medium: scoredJobs.filter((j: any) => j.priority === "medium").length,
      low: scoredJobs.filter((j: any) => j.priority === "low").length,
    };

    console.log(`✅ Scoring complete. Average: ${avgScore.toFixed(1)}/100`);
    console.log(
      `   Priority breakdown: ${priorityCounts.high} high, ${priorityCounts.medium} medium, ${priorityCounts.low} low`
    );

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

      // Save scores to Supabase via API route (absolute URL required server-side)
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (context?.cookie) {
        headers.Cookie = context.cookie;
      }

      const response = await fetch(new URL("/api/jobs/score", baseUrl), {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ scoredJobs }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Failed to save scores:', error);
        throw new Error(error.error || 'Failed to save scores');
      }

      const result = await response.json();
      console.log(`✅ Successfully saved scores for ${result.count} jobs to database`);

      return {
        action: "scored",
        scoredJobs,
        count: scoredJobs.length,
        averageScore: Math.round(avgScore),
        priorityCounts,
        message: `Scored ${scoredJobs.length} job${scoredJobs.length === 1 ? "" : "s"}. Average score: ${Math.round(avgScore)}/100`,
      };
    } catch (error) {
      console.error('💥 Score Jobs Tool error:', error);
      throw error;
    }
  },
};
