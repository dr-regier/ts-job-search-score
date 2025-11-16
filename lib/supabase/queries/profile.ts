/**
 * Profile Supabase Queries
 *
 * Handles database operations for user profiles.
 */

import type { UserProfile } from "@/types/profile";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Retrieves user profile from Supabase
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @returns UserProfile object if exists, null otherwise
 */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    // Map database columns to UserProfile interface
    const profile: UserProfile = {
      name: data.name,
      professionalBackground: data.professional_background,
      skills: data.skills || [],
      salaryMin: data.salary_min,
      salaryMax: data.salary_max,
      preferredLocations: data.preferred_locations || [],
      jobPreferences: data.job_preferences || [],
      dealBreakers: data.deal_breakers || "",
      companyPreferences: data.company_preferences || undefined,
      scoringWeights: data.scoring_weights || {
        salaryMatch: 30,
        locationFit: 20,
        companyAppeal: 25,
        roleMatch: 15,
        requirementsFit: 10,
      },
      updatedAt: data.updated_at,
      createdVia: data.created_via,
    };

    return profile;
  } catch (error) {
    console.error("Error fetching profile from Supabase:", error);
    return null;
  }
}

/**
 * Saves user profile to Supabase (upsert)
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param profile - UserProfile object to save
 * @returns true if save was successful, false otherwise
 */
export async function saveProfile(
  supabase: SupabaseClient,
  userId: string,
  profile: UserProfile
): Promise<boolean> {
  try {
    // Map UserProfile interface to database columns
    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        name: profile.name,
        professional_background: profile.professionalBackground,
        skills: profile.skills,
        salary_min: profile.salaryMin,
        salary_max: profile.salaryMax,
        preferred_locations: profile.preferredLocations,
        job_preferences: profile.jobPreferences,
        deal_breakers: profile.dealBreakers,
        company_preferences: profile.companyPreferences || null,
        scoring_weights: profile.scoringWeights,
        created_via: profile.createdVia,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

    if (error) {
      console.error("Error saving profile to Supabase:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error saving profile to Supabase:", error);
    return false;
  }
}

/**
 * Deletes user profile from Supabase
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @returns true if deletion was successful, false otherwise
 */
export async function deleteProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) {
      console.error("Error deleting profile from Supabase:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting profile from Supabase:", error);
    return false;
  }
}

/**
 * Checks if a user profile exists in Supabase
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @returns true if profile exists, false otherwise
 */
export async function hasProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking profile existence:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking profile existence:", error);
    return false;
  }
}
