/**
 * Resume Storage Utilities
 *
 * Handles localStorage operations for resume data.
 * All functions are SSR-safe and handle parsing errors gracefully.
 */

import type { Resume } from "@/types/resume";

const RESUMES_STORAGE_KEY = "userResumes";

/**
 * Retrieves all resumes from localStorage
 *
 * @returns Array of Resume objects (empty array if none exist)
 */
export function getResumes(): Resume[] {
  // SSR safety check
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const resumesJson = localStorage.getItem(RESUMES_STORAGE_KEY);

    if (!resumesJson) {
      return [];
    }

    const resumes = JSON.parse(resumesJson) as Resume[];
    return resumes;
  } catch (error) {
    console.error("Error reading resumes from localStorage:", error);
    return [];
  }
}

/**
 * Saves a new resume to localStorage
 *
 * Appends the resume to existing resumes array.
 *
 * @param resume - Resume object to save
 * @returns true if save was successful, false otherwise
 */
export function saveResume(resume: Resume): boolean {
  // SSR safety check
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const existingResumes = getResumes();
    const updatedResumes = [...existingResumes, resume];

    const resumesJson = JSON.stringify(updatedResumes);
    localStorage.setItem(RESUMES_STORAGE_KEY, resumesJson);

    return true;
  } catch (error) {
    console.error("Error saving resume to localStorage:", error);
    return false;
  }
}

/**
 * Updates an existing resume's content
 *
 * @param id - Resume ID to update
 * @param content - New content for the resume
 * @returns true if update was successful, false otherwise
 */
export function updateResume(id: string, content: string): boolean {
  // SSR safety check
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const resumes = getResumes();
    const resumeIndex = resumes.findIndex((r) => r.id === id);

    if (resumeIndex === -1) {
      console.warn(`Cannot update resume: resume with id ${id} not found`);
      return false;
    }

    resumes[resumeIndex] = {
      ...resumes[resumeIndex],
      content,
    };

    const resumesJson = JSON.stringify(resumes);
    localStorage.setItem(RESUMES_STORAGE_KEY, resumesJson);

    return true;
  } catch (error) {
    console.error("Error updating resume in localStorage:", error);
    return false;
  }
}

/**
 * Deletes a resume from localStorage
 *
 * @param id - Resume ID to delete
 * @returns true if deletion was successful, false otherwise
 */
export function deleteResume(id: string): boolean {
  // SSR safety check
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const resumes = getResumes();
    const updatedResumes = resumes.filter((r) => r.id !== id);

    const resumesJson = JSON.stringify(updatedResumes);
    localStorage.setItem(RESUMES_STORAGE_KEY, resumesJson);

    return true;
  } catch (error) {
    console.error("Error deleting resume from localStorage:", error);
    return false;
  }
}

/**
 * Gets a specific resume by ID
 *
 * @param id - Resume ID to retrieve
 * @returns Resume object if found, null otherwise
 */
export function getResumeById(id: string): Resume | null {
  const resumes = getResumes();
  return resumes.find((r) => r.id === id) || null;
}

/**
 * Checks if any resumes exist in localStorage
 *
 * @returns true if at least one resume exists, false otherwise
 */
export function hasResumes(): boolean {
  return getResumes().length > 0;
}

/**
 * Deletes all resumes from localStorage
 *
 * @returns true if deletion was successful, false otherwise
 */
export function deleteAllResumes(): boolean {
  // SSR safety check
  if (typeof window === "undefined") {
    return false;
  }

  try {
    localStorage.removeItem(RESUMES_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Error deleting all resumes from localStorage:", error);
    return false;
  }
}

/**
 * Updates resume name
 *
 * @param id - Resume ID to update
 * @param name - New name for the resume
 * @returns true if update was successful, false otherwise
 */
export function updateResumeName(id: string, name: string): boolean {
  // SSR safety check
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const resumes = getResumes();
    const resumeIndex = resumes.findIndex((r) => r.id === id);

    if (resumeIndex === -1) {
      console.warn(`Cannot update resume name: resume with id ${id} not found`);
      return false;
    }

    resumes[resumeIndex] = {
      ...resumes[resumeIndex],
      name,
    };

    const resumesJson = JSON.stringify(resumes);
    localStorage.setItem(RESUMES_STORAGE_KEY, resumesJson);

    return true;
  } catch (error) {
    console.error("Error updating resume name in localStorage:", error);
    return false;
  }
}
