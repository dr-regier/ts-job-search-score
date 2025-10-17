/**
 * Jobs Storage Utilities
 *
 * Handles localStorage operations for job data.
 * All functions are SSR-safe and handle parsing errors gracefully.
 */

import type { Job, ApplicationStatus } from "@/types/job";

const JOBS_STORAGE_KEY = "jobs";

/**
 * Retrieves all saved jobs from localStorage
 *
 * @returns Array of Job objects (empty array if none exist)
 */
export function getJobs(): Job[] {
  // SSR safety check
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const jobsJson = localStorage.getItem(JOBS_STORAGE_KEY);

    if (!jobsJson) {
      return [];
    }

    const jobs = JSON.parse(jobsJson) as Job[];
    return Array.isArray(jobs) ? jobs : [];
  } catch (error) {
    console.error("Error reading jobs from localStorage:", error);
    return [];
  }
}

/**
 * Saves jobs array to localStorage
 *
 * Completely replaces existing jobs with provided array.
 *
 * @param jobs - Array of Job objects to save
 * @returns true if save was successful, false otherwise
 */
export function saveJobs(jobs: Job[]): boolean {
  // SSR safety check
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const jobsJson = JSON.stringify(jobs);
    localStorage.setItem(JOBS_STORAGE_KEY, jobsJson);
    return true;
  } catch (error) {
    console.error("Error saving jobs to localStorage:", error);
    return false;
  }
}

/**
 * Appends new jobs to existing jobs array
 *
 * Checks for duplicates by job ID and only adds unique jobs.
 *
 * @param newJobs - Array of Job objects to add
 * @returns true if operation was successful, false otherwise
 */
export function addJobs(newJobs: Job[]): boolean {
  const existingJobs = getJobs();

  // Create a Set of existing job IDs for efficient lookup
  const existingIds = new Set(existingJobs.map((job) => job.id));

  // Filter out duplicates
  const uniqueNewJobs = newJobs.filter((job) => !existingIds.has(job.id));

  if (uniqueNewJobs.length === 0) {
    console.info("No new unique jobs to add");
    return true; // Not an error, just no new jobs
  }

  // Append new jobs
  const updatedJobs = [...existingJobs, ...uniqueNewJobs];

  return saveJobs(updatedJobs);
}

/**
 * Updates the application status of a specific job
 *
 * @param jobId - ID of the job to update
 * @param status - New application status
 * @returns true if update was successful, false if job not found or error
 */
export function updateJobStatus(
  jobId: string,
  status: ApplicationStatus
): boolean {
  const jobs = getJobs();

  // Find the job
  const jobIndex = jobs.findIndex((job) => job.id === jobId);

  if (jobIndex === -1) {
    console.warn(`Cannot update status: job with ID ${jobId} not found`);
    return false;
  }

  // Update the job
  jobs[jobIndex] = {
    ...jobs[jobIndex],
    applicationStatus: status,
    statusUpdatedAt: new Date().toISOString(),
  };

  return saveJobs(jobs);
}

/**
 * Updates jobs with scoring data from the Job Matching Agent
 *
 * Merges score data into existing jobs by matching job IDs.
 *
 * @param scoredJobs - Array of jobs with score data
 * @returns true if update was successful, false otherwise
 */
export function updateJobsWithScores(scoredJobs: Job[]): boolean {
  const existingJobs = getJobs();

  // Create a map of scored jobs by ID for efficient lookup
  const scoredJobsMap = new Map(scoredJobs.map((job) => [job.id, job]));

  // Update existing jobs with score data
  const updatedJobs = existingJobs.map((job) => {
    const scoredJob = scoredJobsMap.get(job.id);

    if (scoredJob) {
      // Merge score data into existing job
      return {
        ...job,
        score: scoredJob.score,
        scoreBreakdown: scoredJob.scoreBreakdown,
        reasoning: scoredJob.reasoning,
        gaps: scoredJob.gaps,
        priority: scoredJob.priority,
      };
    }

    return job;
  });

  return saveJobs(updatedJobs);
}

/**
 * Retrieves a single job by ID
 *
 * @param jobId - ID of the job to retrieve
 * @returns Job object if found, null otherwise
 */
export function getJobById(jobId: string): Job | null {
  const jobs = getJobs();
  const job = jobs.find((j) => j.id === jobId);
  return job || null;
}

/**
 * Deletes a specific job by ID
 *
 * @param jobId - ID of the job to delete
 * @returns true if deletion was successful, false if job not found or error
 */
export function deleteJob(jobId: string): boolean {
  const jobs = getJobs();
  const filteredJobs = jobs.filter((job) => job.id !== jobId);

  if (filteredJobs.length === jobs.length) {
    console.warn(`Cannot delete: job with ID ${jobId} not found`);
    return false;
  }

  return saveJobs(filteredJobs);
}

/**
 * Deletes all jobs from localStorage
 *
 * @returns true if deletion was successful, false otherwise
 */
export function deleteAllJobs(): boolean {
  // SSR safety check
  if (typeof window === "undefined") {
    return false;
  }

  try {
    localStorage.removeItem(JOBS_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Error deleting jobs from localStorage:", error);
    return false;
  }
}

/**
 * Updates notes for a specific job
 *
 * @param jobId - ID of the job to update
 * @param notes - Notes text to save
 * @returns true if update was successful, false if job not found or error
 */
export function updateJobNotes(jobId: string, notes: string): boolean {
  const jobs = getJobs();

  const jobIndex = jobs.findIndex((job) => job.id === jobId);

  if (jobIndex === -1) {
    console.warn(`Cannot update notes: job with ID ${jobId} not found`);
    return false;
  }

  jobs[jobIndex] = {
    ...jobs[jobIndex],
    notes,
  };

  return saveJobs(jobs);
}

/**
 * Gets jobs filtered by application status
 *
 * @param status - Application status to filter by
 * @returns Array of jobs matching the status
 */
export function getJobsByStatus(status: ApplicationStatus): Job[] {
  const jobs = getJobs();
  return jobs.filter((job) => job.applicationStatus === status);
}

/**
 * Gets jobs filtered by priority level
 *
 * @param priority - Priority level to filter by
 * @returns Array of jobs matching the priority
 */
export function getJobsByPriority(priority: "high" | "medium" | "low"): Job[] {
  const jobs = getJobs();
  return jobs.filter((job) => job.priority === priority);
}

/**
 * Gets only scored jobs (jobs with a score value)
 *
 * @returns Array of jobs that have been scored
 */
export function getScoredJobs(): Job[] {
  const jobs = getJobs();
  return jobs.filter((job) => job.score !== undefined);
}

/**
 * Gets only unsaved/session jobs (jobs without application status)
 *
 * Note: This is for jobs stored temporarily in component state,
 * not typically stored in localStorage.
 *
 * @returns Array of jobs without application status
 */
export function getUnsavedJobs(): Job[] {
  const jobs = getJobs();
  return jobs.filter((job) => job.applicationStatus === undefined);
}

/**
 * Saves tailored resume data to a specific job
 *
 * @param jobId - ID of the job to update
 * @param resumeData - Tailored resume data to save
 * @returns true if update was successful, false if job not found or error
 */
export function saveJobResume(
  jobId: string,
  resumeData: Job["tailoredResume"]
): boolean {
  const jobs = getJobs();

  const jobIndex = jobs.findIndex((job) => job.id === jobId);

  if (jobIndex === -1) {
    console.warn(`Cannot save resume: job with ID ${jobId} not found`);
    return false;
  }

  jobs[jobIndex] = {
    ...jobs[jobIndex],
    tailoredResume: resumeData,
  };

  return saveJobs(jobs);
}
