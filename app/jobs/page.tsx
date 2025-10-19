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
import type { Job, ApplicationStatus } from "@/types/job";
import { Loader2 } from "lucide-react";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingForJob, setGeneratingForJob] = useState<Job | null>(null);
  const [viewingResumeForJob, setViewingResumeForJob] = useState<Job | null>(null);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);

  // Load jobs from Supabase on mount
  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/jobs', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Please log in to view your jobs");
          return;
        }
        throw new Error('Failed to load jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError("Failed to load jobs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (jobId: string, status: ApplicationStatus) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      // Reload jobs after status update
      await loadJobs();
    } catch (err) {
      console.error('Error updating job status:', err);
      setError("Failed to update job status. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleJobRemove = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      // Reload jobs after removal
      await loadJobs();
    } catch (err) {
      console.error('Error deleting job:', err);
      setError("Failed to delete job. Please try again.");
      setTimeout(() => setError(null), 3000);
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

  const handleScoreComplete = async () => {
    // Reload jobs after scoring completes
    await loadJobs();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Loading your jobs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <button
                onClick={loadJobs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
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
        onOpenChange={async (open) => {
          if (!open) {
            setGeneratingForJob(null);
            // Reload jobs to show newly saved resume
            await loadJobs();
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
