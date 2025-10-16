/**
 * Parsed resume sections
 */
export interface ResumeSections {
  /** Professional summary or objective */
  summary?: string;

  /** Work experience section */
  experience?: string;

  /** Skills section */
  skills?: string;

  /** Education section */
  education?: string;

  /** Other sections not categorized */
  other?: string;
}

/**
 * Resume Interface
 *
 * Stores resume data for the user's resume library.
 * Used by agents to match jobs against user's experience.
 */
export interface Resume {
  /** Unique identifier */
  id: string;

  /** Resume name/title */
  name: string;

  /** Resume content (markdown or plain text) */
  content: string;

  /** ISO timestamp of when resume was uploaded */
  uploadedAt: string;

  /** File format */
  format: "markdown" | "text";

  /** Parsed sections from the resume (optional) */
  sections?: ResumeSections;
}

/**
 * Resume file format types
 */
export type ResumeFormat = Resume["format"];

/**
 * Creates a new Resume with generated ID and timestamp
 */
export function createResume(
  name: string,
  content: string,
  format: ResumeFormat
): Resume {
  return {
    id: crypto.randomUUID(),
    name,
    content,
    uploadedAt: new Date().toISOString(),
    format,
  };
}

/**
 * Validates resume content size (max 50KB)
 */
export function validateResumeSize(content: string): boolean {
  const sizeInBytes = new Blob([content]).size;
  const maxSizeInBytes = 50 * 1024; // 50KB
  return sizeInBytes <= maxSizeInBytes;
}

/**
 * Gets file format from file extension
 */
export function getResumeFormat(filename: string): ResumeFormat {
  const extension = filename.split(".").pop()?.toLowerCase();

  if (extension === "md" || extension === "markdown") {
    return "markdown";
  }

  return "text";
}

/**
 * Formats resume size for display
 */
export function formatResumeSize(content: string): string {
  const sizeInBytes = new Blob([content]).size;

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  const sizeInKB = sizeInBytes / 1024;
  return `${sizeInKB.toFixed(1)} KB`;
}

/**
 * Parses resume content to extract structured sections
 *
 * Looks for common section headers and extracts content.
 * Works with both markdown and plain text formats.
 */
export function parseResumeSections(content: string): ResumeSections {
  const sections: ResumeSections = {};

  // Common section header patterns (case-insensitive)
  const summaryPatterns = [
    /^#+\s*(summary|professional summary|objective|about|profile)/im,
    /^(summary|professional summary|objective|about|profile):/im,
  ];

  const experiencePatterns = [
    /^#+\s*(experience|work experience|employment|professional experience)/im,
    /^(experience|work experience|employment|professional experience):/im,
  ];

  const skillsPatterns = [
    /^#+\s*(skills|technical skills|core competencies|expertise)/im,
    /^(skills|technical skills|core competencies|expertise):/im,
  ];

  const educationPatterns = [
    /^#+\s*(education|academic|qualifications)/im,
    /^(education|academic|qualifications):/im,
  ];

  // Helper to extract section content
  const extractSection = (
    patterns: RegExp[],
    text: string
  ): string | undefined => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const startIndex = match.index! + match[0].length;

        // Find next section header or end of document
        const restOfText = text.substring(startIndex);
        const nextHeaderMatch = restOfText.match(/^#+\s*\w+|^\w+:/im);

        const endIndex = nextHeaderMatch
          ? startIndex + nextHeaderMatch.index!
          : text.length;

        return text.substring(startIndex, endIndex).trim();
      }
    }
    return undefined;
  };

  // Extract each section
  sections.summary = extractSection(summaryPatterns, content);
  sections.experience = extractSection(experiencePatterns, content);
  sections.skills = extractSection(skillsPatterns, content);
  sections.education = extractSection(educationPatterns, content);

  return sections;
}

/**
 * Creates a resume with parsed sections
 */
export function createResumeWithSections(
  name: string,
  content: string,
  format: ResumeFormat
): Resume {
  const resume = createResume(name, content, format);
  resume.sections = parseResumeSections(content);
  return resume;
}
