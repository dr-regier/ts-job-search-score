"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/jobs/HeroSection";
import { ActionCards } from "@/components/jobs/ActionCards";
import { DashboardMetrics } from "@/components/jobs/DashboardMetrics";
import { JobTable } from "@/components/jobs/JobTable";
import { GenerateResumeDialog } from "@/components/jobs/GenerateResumeDialog";
import { ViewResumeDialog } from "@/components/jobs/ViewResumeDialog";
import { ScoreJobsDialog } from "@/components/jobs/ScoreJobsDialog";
import { getJobs, updateJobStatus, deleteJob } from "@/lib/storage/jobs";
import type { Job, ApplicationStatus } from "@/types/job";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingForJob, setGeneratingForJob] = useState<Job | null>(null);
  const [viewingResumeForJob, setViewingResumeForJob] = useState<Job | null>(null);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);

  // Load jobs from localStorage on mount
  useEffect(() => {
    const loadJobs = () => {
      const savedJobs = getJobs();
      setJobs(savedJobs);
      setIsLoading(false);
    };

    loadJobs();

    // Listen for storage events (when jobs are updated in other tabs/windows)
    const handleStorageChange = () => {
      loadJobs();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleStatusUpdate = (jobId: string, status: ApplicationStatus) => {
    const success = updateJobStatus(jobId, status);
    if (success) {
      // Reload jobs after status update
      setJobs(getJobs());
    }
  };

  const handleJobRemove = (jobId: string) => {
    const success = deleteJob(jobId);
    if (success) {
      // Reload jobs after removal
      setJobs(getJobs());
    }
  };

  const handleGenerateResume = (job: Job) => {
    setGeneratingForJob(job);
  };

  const handleViewResume = (job: Job) => {
    setViewingResumeForJob(job);
  };

  const handleOpenScoreDialog = () => {
    setScoreDialogOpen(true);
  };

  const handleScoreComplete = () => {
    // Reload jobs after scoring completes
    setJobs(getJobs());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-gray-600 text-lg">Loading your jobs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-4">
          {/* Hero Section */}
          <HeroSection />

          {/* Action Cards */}
          <ActionCards onScoreJobsClick={handleOpenScoreDialog} />

          {/* Dashboard Metrics */}
          <DashboardMetrics jobs={jobs} />

          {/* Jobs Table */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Jobs</h2>
            <JobTable
              jobs={jobs}
              onStatusUpdate={handleStatusUpdate}
              onJobRemove={handleJobRemove}
              onGenerateResume={handleGenerateResume}
              onViewResume={handleViewResume}
            />
          </div>
        </div>
      </div>

      {/* Generate Resume Dialog */}
      <GenerateResumeDialog
        job={generatingForJob}
        open={generatingForJob !== null}
        onOpenChange={(open) => {
          if (!open) {
            setGeneratingForJob(null);
            // Reload jobs to show newly saved resume
            setJobs(getJobs());
          }
        }}
      />

      {/* View Resume Dialog */}
      <ViewResumeDialog
        job={viewingResumeForJob}
        open={viewingResumeForJob !== null}
        onOpenChange={(open) => !open && setViewingResumeForJob(null)}
      />

      {/* Score Jobs Dialog */}
      <ScoreJobsDialog
        open={scoreDialogOpen}
        onOpenChange={setScoreDialogOpen}
        onScoreComplete={handleScoreComplete}
      />
    </div>
  );
}
