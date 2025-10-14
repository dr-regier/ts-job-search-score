"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/jobs/HeroSection";
import { ActionCards } from "@/components/jobs/ActionCards";
import { DashboardMetrics } from "@/components/jobs/DashboardMetrics";
import { JobTable } from "@/components/jobs/JobTable";
import { getJobs, updateJobStatus } from "@/lib/storage/jobs";
import type { Job, ApplicationStatus } from "@/types/job";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">⏳</div>
              <p className="text-gray-600 text-lg">Loading your jobs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
      style={{
        animation: "fade-in 0.5s ease-out forwards",
      }}
    >
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          {/* Hero Section */}
          <HeroSection />

          {/* Action Cards */}
          <ActionCards />

          {/* Dashboard Metrics */}
          <DashboardMetrics jobs={jobs} />

          {/* Jobs Table */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="text-2xl">💼</div>
              <h2 className="text-2xl font-bold text-gray-900">Your Jobs</h2>
            </div>
            <JobTable jobs={jobs} onStatusUpdate={handleStatusUpdate} />
          </div>
        </div>
      </div>
    </div>
  );
}
