"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, ExternalLink, Bookmark } from "lucide-react";
import { ScoreBreakdown } from "./ScoreBreakdown";
import type { Job } from "@/types/job";

interface JobCardProps {
  job: Job;
  status: "saved" | "unsaved";
  onSave?: (job: Job) => void;
  onView?: (job: Job) => void;
  onApply?: (job: Job) => void;
}

export function JobCard({
  job,
  status,
  onSave,
  onView,
  onApply,
}: JobCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isSaved = status === "saved";
  const isScored = job.score !== undefined;

  // Truncate description
  const truncatedDescription =
    job.description.length > 200
      ? job.description.substring(0, 200) + "..."
      : job.description;

  const getPriorityBadge = () => {
    if (!job.priority) return null;

    const config = {
      high: {
        className: "bg-green-100 text-green-800 border border-green-200",
        label: "High Priority",
      },
      medium: {
        className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        label: "Medium Priority",
      },
      low: {
        className: "bg-gray-100 text-gray-800 border border-gray-200",
        label: "Low Priority",
      },
    };

    const { className, label } = config[job.priority];

    return (
      <Badge className={`${className} rounded-full px-3 py-1`}>{label}</Badge>
    );
  };

  return (
    <div
      className={`
        rounded-xl p-6 transition-all duration-300 ease-in-out
        ${
          isSaved
            ? "bg-white shadow-lg border-2 border-blue-500 hover:shadow-xl hover:-translate-y-1"
            : "bg-gray-50/50 backdrop-blur border border-dashed border-gray-300 opacity-75 hover:opacity-90"
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3
            className={`text-xl font-bold mb-1 ${
              isSaved ? "text-gray-900" : "text-gray-700"
            }`}
          >
            {job.title}
          </h3>
          <p
            className={`font-medium ${
              isSaved ? "text-gray-600" : "text-gray-500"
            }`}
          >
            {job.company}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {isSaved ? (
            <Badge className="bg-green-100 text-green-800 border border-green-200 rounded-full px-3 py-1">
              Saved ✓
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-gray-400 text-gray-600 rounded-full px-3 py-1"
            >
              Unsaved
            </Badge>
          )}
          {getPriorityBadge()}
        </div>
      </div>

      {/* Location & Salary */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1 text-gray-500">
          <MapPin className="w-4 h-4" />
          <span>{job.location}</span>
        </div>
        {job.salary && (
          <div className="flex items-center gap-1 text-gray-500">
            <DollarSign className="w-4 h-4" />
            <span>{job.salary}</span>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          {showFullDescription ? job.description : truncatedDescription}
        </p>
        {job.description.length > 200 && (
          <button
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 transition-colors"
          >
            {showFullDescription ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      {/* Score Breakdown */}
      {isScored && job.score !== undefined && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <ScoreBreakdown score={job.score} scoreBreakdown={job.scoreBreakdown} />

          {job.reasoning && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Analysis
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {job.reasoning}
              </p>
            </div>
          )}

          {job.gaps && job.gaps.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Skill Gaps
              </p>
              <ul className="space-y-1">
                {job.gaps.map((gap, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isSaved && onSave && (
          <Button
            onClick={() => onSave(job)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-300 animate-pulse-soft"
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Save Job
          </Button>
        )}

        {isSaved && (
          <>
            <Button
              variant="outline"
              onClick={() => onView && onView(job)}
              className="flex-1 hover:bg-gray-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Details
            </Button>
            <Button
              onClick={() => onApply && onApply(job)}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              Apply Now
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
