/**
 * Score Jobs Tool
 *
 * Allows the Job Matching Agent to return scored jobs with analysis.
 * Updates Supabase database directly with score data.
 */

import { z } from "zod";
import { updateJobsWithScores } from "@/lib/supabase/queries";
import type { SupabaseClient } from "@supabase/supabase-js";

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
    context?: { supabase?: SupabaseClient; userId?: string }
  ) => {
    console.log(`🎯 Score Jobs Tool called for ${scoredJobs.length} job(s)`);

    // Validate context
    if (!context?.supabase || !context?.userId) {
      console.error('❌ Missing Supabase client or userId in context');
      throw new Error('Supabase client and userId required');
    }

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
      // Update jobs with scores directly in Supabase (no internal API call)
      const success = await updateJobsWithScores(
        context.supabase,
        context.userId,
        scoredJobs
      );

      if (!success) {
        console.error('❌ Failed to update jobs with scores in database');
        throw new Error('Failed to save scores to database');
      }

      console.log(`✅ Successfully saved scores for ${scoredJobs.length} jobs to database`);

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
