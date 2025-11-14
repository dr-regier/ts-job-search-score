"use client";

import { useEffect, useState, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/jobs/HeroSection";
import { DashboardMetrics } from "@/components/jobs/DashboardMetrics";
import { JobTable } from "@/components/jobs/JobTable";
import { GenerateResumeDialog } from "@/components/jobs/GenerateResumeDialog";
import { ViewResumeDialog } from "@/components/jobs/ViewResumeDialog";
import type { Job, ApplicationStatus } from "@/types/job";
import { Loader2 } from "lucide-react";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingForJob, setGeneratingForJob] = useState<Job | null>(null);
  const [viewingResumeForJob, setViewingResumeForJob] = useState<Job | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const selectedJobIdsRef = useRef<string[]>([]);

  // Setup useChat for Matching Agent (for direct scoring)
  const { messages, sendMessage, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/match',
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const body = JSON.parse(init?.body as string || '{}');

        // Fetch selected jobs
        const jobsResponse = await fetch('/api/jobs', {
          credentials: 'include',
        });
        const jobsData = await jobsResponse.json();
        const allJobs = jobsData.jobs || [];
        const selectedJobs = allJobs.filter((job: Job) =>
          selectedJobIdsRef.current.includes(job.id)
        );

        // Fetch profile
        const profileResponse = await fetch('/api/profile', {
          credentials: 'include',
        });
        const profileData = await profileResponse.json();

        const enhancedBody = {
          ...body,
          jobs: selectedJobs,
          profile: profileData.profile,
        };

        return fetch(input, {
          ...init,
          credentials: 'include',
          body: JSON.stringify(enhancedBody),
        });
      },
    }),
  });

  // Load jobs from Supabase on mount
  useEffect(() => {
    loadJobs();
  }, []);

  // Watch for scoring completion
  useEffect(() => {
    if (messages.length === 0 || !isScoring) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;

    const parts = (lastMessage as any).parts || [];

    parts.forEach((part: any) => {
      const toolOutput = part.result || part.output;

      if (toolOutput?.action === 'scored' && toolOutput.scoredJobs) {
        // Scoring completed, reload jobs
        setIsScoring(false);
        setMessages([]);
        loadJobs();
      }
    });
  }, [messages, isScoring]);

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

  const handleBulkJobRemove = async (jobIds: string[]) => {
    try {
      // Delete jobs in parallel
      await Promise.all(
        jobIds.map((jobId) =>
          fetch(`/api/jobs/${jobId}`, {
            method: 'DELETE',
            credentials: 'include',
          })
        )
      );

      // Reload jobs after bulk removal
      await loadJobs();
    } catch (err) {
      console.error('Error deleting jobs:', err);
      setError("Failed to delete some jobs. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleBulkScore = async (jobIds: string[]) => {
    try {
      // Store selected job IDs in ref
      selectedJobIdsRef.current = jobIds;

      // Start scoring
      setIsScoring(true);
      setError(null);
      setMessages([]);

      // Send message to trigger scoring
      sendMessage({
        text: `Please analyze and score the selected ${jobIds.length} job${jobIds.length !== 1 ? 's' : ''} against my profile.`,
      });
    } catch (err) {
      console.error('Error starting job scoring:', err);
      setError("Failed to start scoring. Please try again.");
      setIsScoring(false);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleGenerateResume = (job: Job) => {
    setGeneratingForJob(job);
  };

  const handleViewResume = (job: Job) => {
    setViewingResumeForJob(job);
  };

  if (isLoading || isScoring) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {isLoading ? 'Loading your jobs...' : `Scoring ${selectedJobIdsRef.current.length} job${selectedJobIdsRef.current.length !== 1 ? 's' : ''}...`}
              </p>
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

          {/* Dashboard Metrics */}
          <DashboardMetrics jobs={jobs} />

          {/* Jobs Table */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Jobs</h2>
            <JobTable
              jobs={jobs}
              onStatusUpdate={handleStatusUpdate}
              onBulkRemove={handleBulkJobRemove}
              onBulkScore={handleBulkScore}
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
    </div>
  );
}
