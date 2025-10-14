"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Send, Briefcase } from "lucide-react";
import type { Job, ApplicationStatus } from "@/types/job";

interface JobTableProps {
  jobs: Job[];
  onStatusUpdate: (jobId: string, status: ApplicationStatus) => void;
}

export function JobTable({ jobs, onStatusUpdate }: JobTableProps) {
  console.log('JobTable received jobs:', jobs);
  console.log('Jobs count:', jobs.length);
  if (jobs.length > 0) {
    console.log('Sample job structure:', jobs[0]);
  }

  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("score-desc");

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    let filtered = [...jobs];

    // Apply priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter((j) => j.priority === filterPriority);
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((j) => j.applicationStatus === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score-desc":
          return (b.score || 0) - (a.score || 0);
        case "score-asc":
          return (a.score || 0) - (b.score || 0);
        case "date-desc":
          return (
            new Date(b.discoveredAt).getTime() -
            new Date(a.discoveredAt).getTime()
          );
        case "date-asc":
          return (
            new Date(a.discoveredAt).getTime() -
            new Date(b.discoveredAt).getTime()
          );
        case "company":
          return a.company.localeCompare(b.company);
        default:
          return 0;
      }
    });

    console.log('Filtered jobs:', filtered);
    console.log('Filtered count:', filtered.length);

    return filtered;
  }, [jobs, filterPriority, filterStatus, sortBy]);

  const getPriorityBadge = (priority?: Job["priority"]) => {
    if (!priority) return null;

    const config = {
      high: {
        className: "bg-green-100 text-green-800 border-green-200",
        label: "High",
      },
      medium: {
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "Medium",
      },
      low: {
        className: "bg-gray-100 text-gray-800 border-gray-200",
        label: "Low",
      },
    };

    const { className, label } = config[priority];

    return (
      <Badge className={`${className} border rounded-full px-3 py-1`}>
        {label}
      </Badge>
    );
  };

  const getScoreColor = (score?: number) => {
    if (!score) return "text-gray-600";
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-gray-600";
  };

  // Empty state
  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          No Jobs Saved Yet
        </h3>
        <p className="text-gray-600 mb-6">
          Start by discovering jobs in the chat interface, then save them to see
          them here.
        </p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <a href="/">
            <Briefcase className="w-4 h-4 mr-2" />
            Discover Jobs
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Sorting */}
      <div className="bg-white rounded-xl shadow-sm p-4 sticky top-0 z-10">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Filter by Priority
            </label>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Filter by Status
            </label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="saved">Saved</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="interviewing">Interviewing</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Sort By
            </label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score-desc">Score (High to Low)</SelectItem>
                <SelectItem value="score-asc">Score (Low to High)</SelectItem>
                <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                <SelectItem value="company">Company (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Job Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Company
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Location
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Score
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedJobs.map((job, index) => (
                <tr
                  key={job.id}
                  className="border-t border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 text-sm">
                      {job.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {job.company}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {job.location}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        job.score
                      )}`}
                    >
                      {job.score !== undefined ? job.score : "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getPriorityBadge(job.priority)}
                  </td>
                  <td className="px-6 py-4">
                    <Select
                      value={job.applicationStatus || "saved"}
                      onValueChange={(value) =>
                        onStatusUpdate(job.id, value as ApplicationStatus)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saved">Saved</SelectItem>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="interviewing">
                          Interviewing
                        </SelectItem>
                        <SelectItem value="offer">Offer</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="hover:bg-gray-100"
                      >
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        asChild
                      >
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Apply
                        </a>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <div className="text-center text-sm text-gray-600">
        Showing {filteredAndSortedJobs.length} of {jobs.length} jobs
      </div>
    </div>
  );
}
