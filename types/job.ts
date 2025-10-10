/**
 * Job Interface
 *
 * Represents a job posting discovered by the Job Discovery Agent.
 * Can be enriched with scoring data by the Job Matching Agent.
 */
export interface Job {
  /** Unique identifier (UUID) */
  id: string;

  /** Job title */
  title: string;

  /** Company name */
  company: string;

  /** Job location (e.g., "Remote", "San Francisco, CA") */
  location: string;

  /** Salary range (optional, may not be provided in posting) */
  salary?: string;

  /** Full job description */
  description: string;

  /** Array of job requirements/qualifications */
  requirements: string[];

  /** URL to job posting */
  url: string;

  /** Source of job discovery */
  source: "firecrawl" | "adzuna" | "manual";

  /** ISO timestamp when job was discovered */
  discoveredAt: string;

  // --- Scoring Data (added by Job Matching Agent) ---

  /** Overall job fit score (0-100) */
  score?: number;

  /** Breakdown of score by category */
  scoreBreakdown?: {
    /** Points awarded for salary match */
    salaryMatch: number;

    /** Points awarded for location fit */
    locationFit: number;

    /** Points awarded for company appeal */
    companyAppeal: number;

    /** Points awarded for role match */
    roleMatch: number;

    /** Points awarded for requirements fit */
    requirementsFit: number;
  };

  /** Natural language explanation of the score */
  reasoning?: string;

  /** Array of missing qualifications or skill gaps */
  gaps?: string[];

  /** Priority level based on score (high ≥85, medium 70-84, low <70) */
  priority?: "high" | "medium" | "low";

  // --- Application Tracking (added by user) ---

  /** Current application status */
  applicationStatus?: "saved" | "applied" | "interviewing" | "offer" | "rejected";

  /** ISO timestamp of last status update */
  statusUpdatedAt?: string;

  /** User notes about the job or application */
  notes?: string;
}

/**
 * Job source types
 */
export type JobSource = Job["source"];

/**
 * Application status types
 */
export type ApplicationStatus = NonNullable<Job["applicationStatus"]>;

/**
 * Priority level types
 */
export type PriorityLevel = NonNullable<Job["priority"]>;

/**
 * Determines priority level based on score
 * High: ≥85, Medium: 70-84, Low: <70
 */
export function calculatePriority(score: number): PriorityLevel {
  if (score >= 85) return "high";
  if (score >= 70) return "medium";
  return "low";
}

/**
 * Checks if a job has been scored
 */
export function isJobScored(job: Job): boolean {
  return job.score !== undefined && job.scoreBreakdown !== undefined;
}

/**
 * Checks if a job is saved (has been explicitly saved by user)
 */
export function isJobSaved(job: Job): boolean {
  return job.applicationStatus !== undefined;
}

/**
 * Creates a new Job object with required fields
 */
export function createJob(data: {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  url: string;
  source: JobSource;
  salary?: string;
}): Job {
  return {
    ...data,
    discoveredAt: new Date().toISOString(),
  };
}
