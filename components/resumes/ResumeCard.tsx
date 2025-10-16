"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Eye,
  Trash2,
  Calendar,
  FileCode,
  ChevronDown,
  ChevronUp,
  Edit,
} from "lucide-react";
import type { Resume } from "@/types/resume";
import { formatResumeSize } from "@/types/resume";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ResumeCardProps {
  resume: Resume;
  onView?: (resume: Resume) => void;
  onEdit?: (resume: Resume) => void;
  onDelete?: (resumeId: string) => void;
}

export function ResumeCard({ resume, onView, onEdit, onDelete }: ResumeCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Format date
  const uploadDate = new Date(resume.uploadedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Get preview text (first 200 characters)
  const previewText =
    resume.content.length > 200
      ? resume.content.substring(0, 200) + "..."
      : resume.content;

  // Get format badge config
  const formatBadgeConfig = {
    markdown: {
      icon: FileCode,
      label: "Markdown",
      className: "bg-purple-100 text-purple-800 border border-purple-200",
    },
    text: {
      icon: FileText,
      label: "Text",
      className: "bg-blue-100 text-blue-800 border border-blue-200",
    },
  };

  const formatConfig = formatBadgeConfig[resume.format];
  const FormatIcon = formatConfig.icon;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(resume.id);
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="rounded-xl p-6 bg-white shadow-lg border-2 border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {resume.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Uploaded {uploadDate}</span>
            </div>
          </div>
          <Badge className={`${formatConfig.className} rounded-full px-3 py-1`}>
            <FormatIcon className="w-3 h-3 mr-1" />
            {formatConfig.label}
          </Badge>
        </div>

        {/* File Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="font-medium">File Size:</span>
            <span>{formatResumeSize(resume.content)}</span>
          </div>
        </div>

        {/* Preview Section */}
        <div className="mb-4">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showPreview ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Preview
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show Preview
              </>
            )}
          </button>

          {showPreview && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                {previewText}
              </pre>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onView && onView(resume)}
            className="flex-1 hover:bg-gray-100 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button
            variant="outline"
            onClick={() => onEdit && onEdit(resume)}
            className="flex-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{resume.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
