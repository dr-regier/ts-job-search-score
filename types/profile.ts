/**
 * User Profile Interface
 *
 * Stores user's professional information and job search preferences.
 * Used by agents to match jobs and calculate fit scores.
 */
export interface UserProfile {
  /** User's full name */
  name: string;

  /** Professional summary and experience */
  professionalBackground: string;

  /** Array of skills (e.g., ["Python", "React", "AWS"]) */
  skills: string[];

  /** Minimum acceptable salary */
  salaryMin: number;

  /** Maximum desired salary */
  salaryMax: number;

  /** Preferred work locations (e.g., ["Remote", "United States", "San Francisco"]) */
  preferredLocations: string[];

  /** Job type preferences (e.g., ["Full-time", "Remote", "Hybrid"]) */
  jobPreferences: string[];

  /** Deal breakers or requirements that disqualify jobs */
  dealBreakers: string;

  /** Description of ideal company (industries, size, culture, values) - used for Company Fit scoring (optional) */
  companyPreferences?: string;

  /** Weights for scoring categories (must sum to 100) */
  scoringWeights: {
    /** Weight for salary match (default 30) */
    salaryMatch: number;

    /** Weight for location fit (default 20) */
    locationFit: number;

    /** Weight for company appeal (default 25) */
    companyAppeal: number;

    /** Weight for role match (default 15) */
    roleMatch: number;

    /** Weight for requirements fit (default 10) */
    requirementsFit: number;
  };

  /** ISO timestamp of last profile update */
  updatedAt: string;

  /** How the profile was created (optional) */
  createdVia?: "chat" | "form";
}

/**
 * Default scoring weights that sum to 100
 */
export const DEFAULT_SCORING_WEIGHTS = {
  salaryMatch: 30,
  locationFit: 20,
  companyAppeal: 25,
  roleMatch: 15,
  requirementsFit: 10,
} as const;

/**
 * Creates a new UserProfile with default values
 */
export function createDefaultProfile(): UserProfile {
  return {
    name: "",
    professionalBackground: "",
    skills: [],
    salaryMin: 0,
    salaryMax: 0,
    preferredLocations: [],
    jobPreferences: [],
    dealBreakers: "",
    scoringWeights: { ...DEFAULT_SCORING_WEIGHTS },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Validates that scoring weights sum to exactly 100
 */
export function validateScoringWeights(weights: UserProfile["scoringWeights"]): boolean {
  const sum =
    weights.salaryMatch +
    weights.locationFit +
    weights.companyAppeal +
    weights.roleMatch +
    weights.requirementsFit;

  return sum === 100;
}
