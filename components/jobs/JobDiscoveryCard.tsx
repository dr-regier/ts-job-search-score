"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import type { Job } from "@/types/job";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, MapPin, DollarSign, Briefcase } from "lucide-react";

interface JobDiscoveryCardProps {
  job: Job;
  onSave: (job: Job) => Promise<void>;
  onSkip: () => void;
  isSaving?: boolean;
}

/**
 * JobDiscoveryCard Component
 *
 * Beautiful, interactive card displaying a single job posting in the discovery carousel.
 * Part of the "Tinder for jobs" interface for newly discovered jobs.
 */
export function JobDiscoveryCard({ job, onSave, onSkip, isSaving = false }: JobDiscoveryCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const truncatedDescription =
    job.description.length > 200
      ? job.description.slice(0, 200) + "..."
      : job.description;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="p-4 shadow-lg rounded-xl border-2 hover:shadow-xl transition-shadow">
        {/* Company header with logo placeholder */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold truncate">{job.company}</h3>
          </div>
        </div>

        {/* Job title */}
        <h2 className="text-2xl font-bold mb-1 leading-tight">{job.title}</h2>

        {/* Badges for location, salary */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {job.location}
          </Badge>
          {job.salary && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {job.salary}
            </Badge>
          )}
        </div>

        {/* Job description */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {showFullDescription ? job.description : truncatedDescription}
          </p>
          {job.description.length > 200 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-sm text-blue-600 hover:underline mt-1 font-medium"
            >
              {showFullDescription ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Requirements tags */}
        {job.requirements.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold mb-2">Key Requirements:</p>
            <div className="flex flex-wrap gap-2">
              {job.requirements.slice(0, 5).map((req, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {req}
                </Badge>
              ))}
              {job.requirements.length > 5 && (
                <Badge variant="outline" className="text-xs font-semibold">
                  +{job.requirements.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            size="default"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
            onClick={() => onSave(job)}
            disabled={isSaving}
          >
            <Check className="w-4 h-4 mr-1" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="default"
            variant="outline"
            className="flex-1 font-semibold"
            onClick={onSkip}
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-1" />
            Skip
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
