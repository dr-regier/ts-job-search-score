/**
 * Generate Resume Tool
 *
 * Allows the Resume Generator Agent to create tailored resumes for specific jobs.
 * Takes a job ID and master resume ID, returns a tailored resume with analysis.
 */

import { z } from "zod";
import { getJobById } from "@/lib/storage/jobs";
import { getResumeById } from "@/lib/storage/resumes";
import { getProfile } from "@/lib/storage/profile";

/**
 * Generate Tailored Resume Tool
 *
 * Used by the Resume Generator Agent to fetch job and resume data,
 * then return the agent's tailored resume version with change analysis.
 * The agent performs the actual resume tailoring through LLM reasoning.
 */
export const generateTailoredResumeTool = {
  description:
    "Generate a tailored resume for a specific job opportunity. Provide the job ID and master resume ID, and the agent will customize the resume by reordering content, emphasizing relevant experience, and incorporating job keywords while maintaining complete authenticity. Returns the tailored resume content, list of changes made, and match analysis.",

  inputSchema: z.object({
    jobId: z
      .string()
      .describe("ID of the job to tailor the resume for"),
    masterResumeId: z
      .string()
      .describe("ID of the master resume to use as base"),
    tailoredResumeContent: z
      .string()
      .describe(
        "The complete tailored resume in markdown format with all sections (Summary, Experience, Skills, Education)"
      ),
    changes: z
      .array(
        z.object({
          type: z
            .enum([
              "reorder",
              "keyword",
              "emphasis",
              "summary",
              "trim",
              "section_move",
            ])
            .describe("Type of change made"),
          description: z
            .string()
            .describe("Clear description of what was changed and why"),
        })
      )
      .describe("List of all modifications made to the master resume"),
    matchAnalysis: z
      .object({
        alignmentScore: z
          .number()
          .min(0)
          .max(100)
          .describe(
            "How well the tailored resume addresses the job requirements (0-100)"
          ),
        addressedRequirements: z
          .array(z.string())
          .describe(
            "List of job requirements that are now prominently featured in the tailored resume"
          ),
        remainingGaps: z
          .array(z.string())
          .describe(
            "Skills or experience from job description not present in the master resume"
          ),
        recommendations: z
          .array(z.string())
          .describe(
            "Actionable suggestions for cover letter, interview prep, or additional steps"
          ),
      })
      .describe("Analysis of how well the tailored resume matches the job"),
  }),

  execute: async ({
    jobId,
    masterResumeId,
    tailoredResumeContent,
    changes,
    matchAnalysis,
  }: {
    jobId: string;
    masterResumeId: string;
    tailoredResumeContent: string;
    changes: Array<{ type: string; description: string }>;
    matchAnalysis: {
      alignmentScore: number;
      addressedRequirements: string[];
      remainingGaps: string[];
      recommendations: string[];
    };
  }) => {
    console.log(`📝 Generate Resume Tool called`);
    console.log(`   Job ID: ${jobId}`);
    console.log(`   Master Resume ID: ${masterResumeId}`);

    // Fetch job details
    const job = getJobById(jobId);
    if (!job) {
      console.error(`❌ Job not found: ${jobId}`);
      throw new Error(`Job with ID ${jobId} not found`);
    }

    // Fetch master resume
    const masterResume = getResumeById(masterResumeId);
    if (!masterResume) {
      console.error(`❌ Resume not found: ${masterResumeId}`);
      throw new Error(`Resume with ID ${masterResumeId} not found`);
    }

    // Fetch user profile (for reference)
    const userProfile = getProfile();

    console.log(`✅ Data retrieved successfully`);
    console.log(`   Job: ${job.title} at ${job.company}`);
    console.log(`   Master Resume: ${masterResume.name}`);
    console.log(`   Changes Made: ${changes.length}`);
    console.log(`   Alignment Score: ${matchAnalysis.alignmentScore}/100`);

    // Return the tailored resume and analysis
    return {
      action: "generated",
      tailoredResume: {
        content: tailoredResumeContent,
        masterResumeName: masterResume.name,
        targetJob: {
          title: job.title,
          company: job.company,
          id: job.id,
        },
        generatedAt: new Date().toISOString(),
      },
      changes,
      matchAnalysis,
      message: `Generated tailored resume for ${job.title} at ${job.company} (Alignment: ${matchAnalysis.alignmentScore}/100)`,
    };
  },
};

/**
 * Helper function to provide job and resume context to the agent
 *
 * This is called at the beginning of the agent conversation to provide
 * all necessary context for resume generation.
 */
export function getResumeGenerationContext(
  jobId: string,
  masterResumeId: string
): string {
  const job = getJobById(jobId);
  const masterResume = getResumeById(masterResumeId);
  const userProfile = getProfile();

  if (!job) {
    return `Error: Job with ID ${jobId} not found. Please provide a valid job ID from the user's saved jobs.`;
  }

  if (!masterResume) {
    return `Error: Resume with ID ${masterResumeId} not found. Please provide a valid resume ID from the user's resume library.`;
  }

  return `
# Resume Generation Context

## Target Job
**Title:** ${job.title}
**Company:** ${job.company}
**Location:** ${job.location}
${job.salary ? `**Salary:** ${job.salary}` : ""}

**Job Description:**
${job.description}

**Requirements:**
${job.requirements.map((req) => `- ${req}`).join("\n")}

${
  job.score
    ? `
**Job Fit Score:** ${job.score}/100
${
  job.scoreBreakdown
    ? `
**Score Breakdown:**
- Salary Match: ${job.scoreBreakdown.salaryMatch}
- Location Fit: ${job.scoreBreakdown.locationFit}
- Company Appeal: ${job.scoreBreakdown.companyAppeal}
- Role Match: ${job.scoreBreakdown.roleMatch}
- Requirements Fit: ${job.scoreBreakdown.requirementsFit}
`
    : ""
}
${job.reasoning ? `**Fit Analysis:** ${job.reasoning}` : ""}
${job.gaps && job.gaps.length > 0 ? `**Identified Gaps:** ${job.gaps.join(", ")}` : ""}
`
    : ""
}

## Master Resume
**Name:** ${masterResume.name}
**Format:** ${masterResume.format}
**Uploaded:** ${new Date(masterResume.uploadedAt).toLocaleDateString()}

**Content:**
${masterResume.content}

${
  masterResume.sections
    ? `
**Parsed Sections:**
${masterResume.sections.summary ? `**Summary:**\n${masterResume.sections.summary}\n` : ""}
${masterResume.sections.experience ? `**Experience:**\n${masterResume.sections.experience}\n` : ""}
${masterResume.sections.skills ? `**Skills:**\n${masterResume.sections.skills}\n` : ""}
${masterResume.sections.education ? `**Education:**\n${masterResume.sections.education}\n` : ""}
`
    : ""
}

${
  userProfile
    ? `
## User Profile
**Name:** ${userProfile.name}
**Professional Background:** ${userProfile.professionalBackground}
**Skills:** ${userProfile.skills.join(", ")}
**Salary Range:** $${userProfile.salaryMin.toLocaleString()} - $${userProfile.salaryMax.toLocaleString()}
**Preferred Locations:** ${userProfile.preferredLocations.join(", ")}
**Job Preferences:** ${userProfile.jobPreferences.join(", ")}
${userProfile.dealBreakers ? `**Deal Breakers:** ${userProfile.dealBreakers}` : ""}
`
    : ""
}

---

Now, tailor the master resume for this specific job opportunity. Remember:
- ONLY use real experience from the master resume
- Reorder content to emphasize job-relevant experience
- Integrate job description keywords naturally
- Maintain the candidate's authentic voice
- Keep to 1-2 pages
- Document all changes made

Use the generateTailoredResume tool to return your tailored resume with change analysis.
`;
}
