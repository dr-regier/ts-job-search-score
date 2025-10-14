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

  const scoredJobs = jobs.filter((j) => j.score !== undefined);
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
      color: "text-blue-600",
      icon: BarChart3,
      bg: "bg-blue-50",
    },
    {
      label: "High Priority",
      value: highPriorityCount.toLocaleString(),
      color: "text-green-600",
      icon: TrendingUp,
      bg: "bg-green-50",
    },
    {
      label: "Medium Priority",
      value: mediumPriorityCount.toLocaleString(),
      color: "text-yellow-600",
      icon: TrendingDown,
      bg: "bg-yellow-50",
    },
    {
      label: "Avg Score",
      value: averageScore > 0 ? averageScore.toFixed(1) : "N/A",
      color: "text-purple-600",
      icon: Star,
      bg: "bg-purple-50",
    },
    {
      label: "Last Updated",
      value: getLastUpdated(),
      color: "text-gray-600",
      icon: Clock,
      bg: "bg-gray-50",
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6 text-gray-700" />
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Metrics</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`
              bg-white rounded-xl shadow-md hover:shadow-lg
              transition-all duration-300 p-6
              border border-gray-200
              ${metric.bg}
            `}
            style={{
              animation: `fade-in 0.5s ease-out forwards`,
              animationDelay: `${index * 100}ms`,
              opacity: 0,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
            </div>
            <div className={`text-5xl font-bold mb-2 ${metric.color}`}>
              {metric.value}
            </div>
            <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">
              {metric.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
