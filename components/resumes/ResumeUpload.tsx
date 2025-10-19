"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import {
  getResumeFormat,
  validateResumeSize,
  formatResumeSize,
} from "@/types/resume";

interface ResumeUploadProps {
  onUploadSuccess?: () => void;
}

export function ResumeUpload({ onUploadSuccess }: ResumeUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Reset states
    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      // Validate file type
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (
        fileExtension !== "md" &&
        fileExtension !== "markdown" &&
        fileExtension !== "txt"
      ) {
        setError("Invalid file type. Please upload a .md, .markdown, or .txt file.");
        setIsUploading(false);
        return;
      }

      // Read file content
      const content = await file.text();

      // Validate file size (max 50KB)
      if (!validateResumeSize(content)) {
        setError(`File too large. Maximum size is 50KB. Your file is ${formatResumeSize(content)}.`);
        setIsUploading(false);
        return;
      }

      // Validate content is not empty
      if (content.trim().length === 0) {
        setError("File is empty. Please upload a file with content.");
        setIsUploading(false);
        return;
      }

      // Get resume name from filename (without extension)
      const resumeName = file.name.replace(/\.(md|markdown|txt)$/i, "");

      // Get file format
      const format = getResumeFormat(file.name);

      // Upload to Supabase via API
      const formData = new FormData();
      formData.append('name', resumeName);
      formData.append('content', content);
      formData.append('format', format);

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload resume');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error('Failed to upload resume');
      }

      // Success!
      setSuccess(`Resume "${resumeName}" uploaded successfully!`);
      setIsUploading(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      console.error("Error uploading resume:", err);
      setError(err instanceof Error ? err.message : "An error occurred while uploading the file. Please try again.");
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        <Button
          onClick={handleButtonClick}
          disabled={isUploading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-300"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? "Uploading..." : "Upload Resume"}
        </Button>
        <p className="text-sm text-gray-500 mt-2">
          Accepts .md, .markdown, and .txt files (max 50KB)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Upload Failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Upload Successful</p>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}
    </div>
  );
}
