"use client";

import { BarChart3, TrendingUp, TrendingDown, Star, Clock } from "lucide-react";
import type { Job } from "@/types/job";

interface DashboardMetricsProps {
  jobs: Job[];
}

export function DashboardMetrics({ jobs }: DashboardMetricsProps) {
  // Calculate metrics
  const totalJobs = jobs.length;
  const highPriorityCount = jobs.filter((j) => j.priority === "high").length;
  const mediumPriorityCount = jobs.filter(
    (j) => j.priority === "medium"
  ).length;

  const scoredJobs = jobs.filter(
    (j) => j.score !== undefined && j.score !== null
  );
  const averageScore =
    scoredJobs.length > 0
      ? scoredJobs.reduce((sum, j) => sum + (j.score || 0), 0) /
        scoredJobs.length
      : 0;

  // Format last updated
  const getLastUpdated = () => {
    if (jobs.length === 0) return "N/A";

    const timestamps = jobs
      .map((j) => j.statusUpdatedAt || j.discoveredAt)
      .sort()
      .reverse();

    if (timestamps.length === 0) return "N/A";

    const lastDate = new Date(timestamps[0]);
    const today = new Date();
    const isToday =
      lastDate.toDateString() === today.toDateString();

    if (isToday) return "Today";

    return lastDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const metrics = [
    {
      label: "Total Jobs",
      value: totalJobs.toLocaleString(),
      icon: BarChart3,
    },
    {
      label: "High Priority",
      value: highPriorityCount.toLocaleString(),
      icon: TrendingUp,
    },
    {
      label: "Medium Priority",
      value: mediumPriorityCount.toLocaleString(),
      icon: TrendingDown,
    },
    {
      label: "Avg Score",
      value: averageScore > 0 ? averageScore.toFixed(1) : "N/A",
      icon: Star,
    },
    {
      label: "Last Updated",
      value: getLastUpdated(),
      icon: Clock,
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Overview</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white border border-gray-200 rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <metric.icon className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-0.5">
              {metric.value}
            </div>
            <div className="text-xs text-gray-600">
              {metric.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
