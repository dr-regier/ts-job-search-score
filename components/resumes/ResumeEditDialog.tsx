"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Resume } from "@/types/resume";
import { parseResumeSections } from "@/types/resume";
import { updateResume, updateResumeName } from "@/lib/storage/resumes";

interface ResumeEditDialogProps {
  resume: Resume | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess?: () => void;
}

export function ResumeEditDialog({
  resume,
  open,
  onOpenChange,
  onSaveSuccess,
}: ResumeEditDialogProps) {
  const [name, setName] = useState(resume?.name || "");
  const [content, setContent] = useState(resume?.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update state when resume changes
  const handleOpen = (isOpen: boolean) => {
    if (isOpen && resume) {
      setName(resume.name);
      setContent(resume.content);
      setError(null);
    }
    onOpenChange(isOpen);
  };

  const handleSave = async () => {
    if (!resume) return;

    setIsSaving(true);
    setError(null);

    try {
      // Validate content is not empty
      if (content.trim().length === 0) {
        setError("Resume content cannot be empty.");
        setIsSaving(false);
        return;
      }

      // Validate name is not empty
      if (name.trim().length === 0) {
        setError("Resume name cannot be empty.");
        setIsSaving(false);
        return;
      }

      // Update resume content
      const contentUpdated = updateResume(resume.id, content);
      if (!contentUpdated) {
        setError("Failed to update resume content.");
        setIsSaving(false);
        return;
      }

      // Update resume name if changed
      if (name !== resume.name) {
        const nameUpdated = updateResumeName(resume.id, name);
        if (!nameUpdated) {
          setError("Failed to update resume name.");
          setIsSaving(false);
          return;
        }
      }

      // Success!
      setIsSaving(false);
      onOpenChange(false);

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err) {
      console.error("Error saving resume:", err);
      setError("An error occurred while saving. Please try again.");
      setIsSaving(false);
    }
  };

  if (!resume) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Resume</DialogTitle>
          <DialogDescription>
            Make changes to your resume. Changes will be saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Resume Name */}
          <div className="space-y-2">
            <Label htmlFor="resume-name">Resume Name</Label>
            <Input
              id="resume-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Software Engineer Resume"
            />
          </div>

          {/* Resume Content */}
          <div className="space-y-2">
            <Label htmlFor="resume-content">Resume Content</Label>
            <Textarea
              id="resume-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-mono text-sm min-h-[400px]"
              placeholder="Enter your resume content here..."
            />
            <p className="text-sm text-gray-500">
              Supports markdown formatting. Use headers to organize sections
              (Summary, Experience, Skills, Education).
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
