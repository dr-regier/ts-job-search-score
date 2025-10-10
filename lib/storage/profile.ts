/**
 * Profile Storage Utilities
 *
 * Handles localStorage operations for user profile data.
 * All functions are SSR-safe and handle parsing errors gracefully.
 */

import type { UserProfile } from "@/types/profile";

const PROFILE_STORAGE_KEY = "userProfile";

/**
 * Retrieves user profile from localStorage
 *
 * @returns UserProfile object if exists, null otherwise
 */
export function getProfile(): UserProfile | null {
  // SSR safety check
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const profileJson = localStorage.getItem(PROFILE_STORAGE_KEY);

    if (!profileJson) {
      return null;
    }

    const profile = JSON.parse(profileJson) as UserProfile;
    return profile;
  } catch (error) {
    console.error("Error reading profile from localStorage:", error);
    return null;
  }
}

/**
 * Saves user profile to localStorage
 *
 * Automatically updates the updatedAt timestamp.
 *
 * @param profile - UserProfile object to save
 * @returns true if save was successful, false otherwise
 */
export function saveProfile(profile: UserProfile): boolean {
  // SSR safety check
  if (typeof window === "undefined") {
    return false;
  }

  try {
    // Update timestamp
    const profileWithTimestamp: UserProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    const profileJson = JSON.stringify(profileWithTimestamp);
    localStorage.setItem(PROFILE_STORAGE_KEY, profileJson);

    return true;
  } catch (error) {
    console.error("Error saving profile to localStorage:", error);
    return false;
  }
}

/**
 * Deletes user profile from localStorage
 *
 * @returns true if deletion was successful, false otherwise
 */
export function deleteProfile(): boolean {
  // SSR safety check
  if (typeof window === "undefined") {
    return false;
  }

  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Error deleting profile from localStorage:", error);
    return false;
  }
}

/**
 * Checks if a user profile exists in localStorage
 *
 * @returns true if profile exists, false otherwise
 */
export function hasProfile(): boolean {
  // SSR safety check
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const profileJson = localStorage.getItem(PROFILE_STORAGE_KEY);
    return profileJson !== null;
  } catch (error) {
    console.error("Error checking profile existence:", error);
    return false;
  }
}

/**
 * Updates specific fields in the user profile
 *
 * Merges provided fields with existing profile data.
 *
 * @param updates - Partial UserProfile with fields to update
 * @returns true if update was successful, false otherwise
 */
export function updateProfile(updates: Partial<UserProfile>): boolean {
  const existingProfile = getProfile();

  if (!existingProfile) {
    console.warn("Cannot update profile: no existing profile found");
    return false;
  }

  const updatedProfile: UserProfile = {
    ...existingProfile,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return saveProfile(updatedProfile);
}
