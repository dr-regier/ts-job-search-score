/**
 * Jobs Supabase Queries
 *
 * Handles database operations for jobs.
 */

import type { Job, ApplicationStatus, PriorityLevel } from "@/types/job";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Retrieves all saved jobs for a user from Supabase
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @returns Array of Job objects (empty array if none exist)
 */
export async function getJobs(
  supabase: SupabaseClient,
  userId: string
): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", userId)
      .order("discovered_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs from Supabase:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    // Map database columns to Job interface
    return data.map(mapDatabaseToJob);
  } catch (error) {
    console.error("Error fetching jobs from Supabase:", error);
    return [];
  }
}

/**
 * Saves jobs to Supabase (bulk insert with conflict handling)
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param jobs - Array of Job objects to save
 * @returns true if save was successful, false otherwise
 */
export async function saveJobs(
  supabase: SupabaseClient,
  userId: string,
  jobs: Job[]
): Promise<boolean> {
  try {
    // Map Job interface to database columns
    const jobRecords = jobs.map((job) => mapJobToDatabase(job, userId));

    const { error } = await supabase.from("jobs").insert(jobRecords);

    if (error) {
      console.error("Error saving jobs to Supabase:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error saving jobs to Supabase:", error);
    return false;
  }
}

/**
 * Updates the application status of a specific job
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param jobId - ID of the job to update
 * @param status - New application status
 * @returns true if update was successful, false otherwise
 */
export async function updateJobStatus(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  status: ApplicationStatus
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("jobs")
      .update({
        application_status: status,
        status_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating job status in Supabase:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating job status in Supabase:", error);
    return false;
  }
}

/**
 * Updates jobs with scoring data from the Job Matching Agent
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param scoredJobs - Array of jobs with score data
 * @returns true if update was successful, false otherwise
 */
export async function updateJobsWithScores(
  supabase: SupabaseClient,
  userId: string,
  scoredJobs: Job[]
): Promise<boolean> {
  try {
    // Update each job individually
    const updates = scoredJobs.map((job) =>
      supabase
        .from("jobs")
        .update({
          score: job.score,
          score_breakdown: job.scoreBreakdown,
          reasoning: job.reasoning,
          gaps: job.gaps,
          priority: job.priority,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .eq("user_id", userId)
    );

    const results = await Promise.all(updates);

    // Check if any updates failed
    const hasErrors = results.some((result) => result.error);

    if (hasErrors) {
      console.error("Some job score updates failed");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating jobs with scores in Supabase:", error);
    return false;
  }
}

/**
 * Saves tailored resume data to a specific job
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param jobId - ID of the job to update
 * @param resumeData - Tailored resume data to save
 * @returns true if update was successful, false otherwise
 */
export async function saveJobResume(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  resumeData: Job["tailoredResume"]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("jobs")
      .update({
        tailored_resume: resumeData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error saving tailored resume to job in Supabase:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error saving tailored resume to job in Supabase:", error);
    return false;
  }
}

/**
 * Retrieves a single job by ID
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param jobId - ID of the job to retrieve
 * @returns Job object if found, null otherwise
 */
export async function getJobById(
  supabase: SupabaseClient,
  userId: string,
  jobId: string
): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching job by ID from Supabase:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return mapDatabaseToJob(data);
  } catch (error) {
    console.error("Error fetching job by ID from Supabase:", error);
    return null;
  }
}

/**
 * Deletes a specific job by ID
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param jobId - ID of the job to delete
 * @returns true if deletion was successful, false otherwise
 */
export async function deleteJob(
  supabase: SupabaseClient,
  userId: string,
  jobId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting job from Supabase:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting job from Supabase:", error);
    return false;
  }
}

/**
 * Updates notes for a specific job
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param jobId - ID of the job to update
 * @param notes - Notes text to save
 * @returns true if update was successful, false otherwise
 */
export async function updateJobNotes(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  notes: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("jobs")
      .update({
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating job notes in Supabase:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating job notes in Supabase:", error);
    return false;
  }
}

/**
 * Gets jobs filtered by application status
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param status - Application status to filter by
 * @returns Array of jobs matching the status
 */
export async function getJobsByStatus(
  supabase: SupabaseClient,
  userId: string,
  status: ApplicationStatus
): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", userId)
      .eq("application_status", status)
      .order("discovered_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs by status from Supabase:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map(mapDatabaseToJob);
  } catch (error) {
    console.error("Error fetching jobs by status from Supabase:", error);
    return [];
  }
}

/**
 * Gets jobs filtered by priority level
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param priority - Priority level to filter by
 * @returns Array of jobs matching the priority
 */
export async function getJobsByPriority(
  supabase: SupabaseClient,
  userId: string,
  priority: PriorityLevel
): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", userId)
      .eq("priority", priority)
      .order("score", { ascending: false });

    if (error) {
      console.error("Error fetching jobs by priority from Supabase:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map(mapDatabaseToJob);
  } catch (error) {
    console.error("Error fetching jobs by priority from Supabase:", error);
    return [];
  }
}

/**
 * Gets only scored jobs (jobs with a score value)
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @returns Array of jobs that have been scored
 */
export async function getScoredJobs(
  supabase: SupabaseClient,
  userId: string
): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", userId)
      .not("score", "is", null)
      .order("score", { ascending: false });

    if (error) {
      console.error("Error fetching scored jobs from Supabase:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map(mapDatabaseToJob);
  } catch (error) {
    console.error("Error fetching scored jobs from Supabase:", error);
    return [];
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Maps database row to Job interface
 */
function mapDatabaseToJob(data: any): Job {
  return {
    id: data.id,
    title: data.title,
    company: data.company,
    location: data.location,
    salary: data.salary,
    description: data.description,
    requirements: data.requirements || [],
    url: data.url,
    source: data.source,
    discoveredAt: data.discovered_at,
    score: data.score,
    scoreBreakdown: data.score_breakdown,
    reasoning: data.reasoning,
    gaps: data.gaps,
    priority: data.priority,
    applicationStatus: data.application_status,
    statusUpdatedAt: data.status_updated_at,
    notes: data.notes,
    tailoredResume: data.tailored_resume,
  };
}

/**
 * Maps Job interface to database columns
 */
function mapJobToDatabase(job: Job, userId: string): any {
  return {
    id: job.id,
    user_id: userId,
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary,
    description: job.description,
    requirements: job.requirements,
    url: job.url,
    source: job.source,
    discovered_at: job.discoveredAt,
    score: job.score,
    score_breakdown: job.scoreBreakdown,
    reasoning: job.reasoning,
    gaps: job.gaps,
    priority: job.priority,
    application_status: job.applicationStatus,
    status_updated_at: job.statusUpdatedAt,
    notes: job.notes,
    tailored_resume: job.tailoredResume,
  };
}
