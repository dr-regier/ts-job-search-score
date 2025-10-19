/**
 * Resumes Supabase Queries
 *
 * Handles database operations for resumes with Supabase Storage integration.
 * Files are stored in Storage bucket, metadata in database.
 */

import type { Resume, ResumeFormat } from "@/types/resume";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseResumeSections } from "@/types/resume";

const STORAGE_BUCKET = "resumes";

/**
 * Uploads resume to Supabase Storage and saves metadata to database
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param name - Resume name
 * @param file - File object or content string
 * @param format - Resume format (markdown or text)
 * @returns Resume object if successful, null otherwise
 */
export async function uploadResume(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  file: File | string,
  format: ResumeFormat
): Promise<Resume | null> {
  try {
    const resumeId = crypto.randomUUID();
    const extension = format === "markdown" ? "md" : "txt";
    const filePath = `${userId}/${resumeId}.${extension}`;

    // Upload file to Storage
    const fileContent = typeof file === "string" ? file : await file.text();
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileContent, {
        contentType: format === "markdown" ? "text/markdown" : "text/plain",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading resume to Storage:", uploadError);
      return null;
    }

    // Calculate file size
    const fileSize = new Blob([fileContent]).size;

    // Parse sections
    const sections = parseResumeSections(fileContent);

    // Save metadata to database
    const { data, error: dbError } = await supabase
      .from("resumes")
      .insert({
        id: resumeId,
        user_id: userId,
        name,
        file_path: filePath,
        file_size: fileSize,
        format,
        is_master: true,
        sections,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error saving resume metadata to database:", dbError);
      // Clean up uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      return null;
    }

    return mapDatabaseToResume(data, fileContent);
  } catch (error) {
    console.error("Error uploading resume:", error);
    return null;
  }
}

/**
 * Retrieves all resumes for a user from Supabase
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @returns Array of Resume objects (without content - use getResumeContent to fetch)
 */
export async function getResumes(
  supabase: SupabaseClient,
  userId: string
): Promise<Omit<Resume, "content">[]> {
  try {
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching resumes from Supabase:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    // Map database columns to Resume interface (without content)
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      uploadedAt: row.created_at,
      format: row.format,
      sections: row.sections,
      content: "", // Content not loaded yet
    }));
  } catch (error) {
    console.error("Error fetching resumes from Supabase:", error);
    return [];
  }
}

/**
 * Retrieves resume content from Supabase Storage
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param resumeId - Resume ID
 * @returns Resume content as string, null if not found
 */
export async function getResumeContent(
  supabase: SupabaseClient,
  userId: string,
  resumeId: string
): Promise<string | null> {
  try {
    // Get file_path from database
    const { data: metadata, error: dbError } = await supabase
      .from("resumes")
      .select("file_path")
      .eq("id", resumeId)
      .eq("user_id", userId)
      .single();

    if (dbError || !metadata) {
      console.error("Error fetching resume metadata:", dbError);
      return null;
    }

    // Download file from Storage
    const { data, error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(metadata.file_path);

    if (storageError) {
      console.error("Error downloading resume from Storage:", storageError);
      return null;
    }

    const content = await data.text();
    return content;
  } catch (error) {
    console.error("Error getting resume content:", error);
    return null;
  }
}

/**
 * Gets a specific resume by ID with content
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param resumeId - Resume ID
 * @returns Resume object with content if found, null otherwise
 */
export async function getResumeById(
  supabase: SupabaseClient,
  userId: string,
  resumeId: string
): Promise<Resume | null> {
  try {
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      console.error("Error fetching resume by ID:", error);
      return null;
    }

    // Get content from Storage
    const content = await getResumeContent(supabase, userId, resumeId);

    if (!content) {
      return null;
    }

    return mapDatabaseToResume(data, content);
  } catch (error) {
    console.error("Error getting resume by ID:", error);
    return null;
  }
}

/**
 * Updates resume name in database
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param resumeId - Resume ID
 * @param name - New name
 * @returns true if update was successful, false otherwise
 */
export async function updateResumeName(
  supabase: SupabaseClient,
  userId: string,
  resumeId: string,
  name: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("resumes")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", resumeId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating resume name:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating resume name:", error);
    return false;
  }
}

/**
 * Updates resume content in Storage and re-parses sections
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param resumeId - Resume ID
 * @param content - New content
 * @returns true if update was successful, false otherwise
 */
export async function updateResumeContent(
  supabase: SupabaseClient,
  userId: string,
  resumeId: string,
  content: string
): Promise<boolean> {
  try {
    // Get file_path from database
    const { data: metadata, error: dbError } = await supabase
      .from("resumes")
      .select("file_path")
      .eq("id", resumeId)
      .eq("user_id", userId)
      .single();

    if (dbError || !metadata) {
      console.error("Error fetching resume metadata:", dbError);
      return false;
    }

    // Update file in Storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .update(metadata.file_path, content, {
        contentType: "text/plain",
        upsert: true,
      });

    if (storageError) {
      console.error("Error updating resume in Storage:", storageError);
      return false;
    }

    // Re-parse sections and update metadata
    const sections = parseResumeSections(content);
    const fileSize = new Blob([content]).size;

    const { error: updateError } = await supabase
      .from("resumes")
      .update({
        sections,
        file_size: fileSize,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resumeId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating resume metadata:", updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating resume content:", error);
    return false;
  }
}

/**
 * Deletes resume from Storage and database
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param resumeId - Resume ID
 * @returns true if deletion was successful, false otherwise
 */
export async function deleteResume(
  supabase: SupabaseClient,
  userId: string,
  resumeId: string
): Promise<boolean> {
  try {
    // Get file_path from database
    const { data: metadata, error: dbError } = await supabase
      .from("resumes")
      .select("file_path")
      .eq("id", resumeId)
      .eq("user_id", userId)
      .single();

    if (dbError || !metadata) {
      console.error("Error fetching resume metadata:", dbError);
      return false;
    }

    // Delete from Storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([metadata.file_path]);

    if (storageError) {
      console.error("Error deleting resume from Storage:", storageError);
      // Continue with database deletion even if Storage deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("resumes")
      .delete()
      .eq("id", resumeId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting resume from database:", deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting resume:", error);
    return false;
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Maps database row to Resume interface
 */
function mapDatabaseToResume(data: any, content: string): Resume {
  return {
    id: data.id,
    name: data.name,
    content,
    uploadedAt: data.created_at,
    format: data.format,
    sections: data.sections,
  };
}
