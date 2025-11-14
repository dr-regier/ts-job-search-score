"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Send, Briefcase, Trash2, Sparkles, ChevronDown, AlertCircle, FileText } from "lucide-react";
import { ScoreBreakdown } from "@/components/jobs/ScoreBreakdown";
import type { Job, ApplicationStatus } from "@/types/job";

interface JobTableProps {
  jobs: Job[];
  onStatusUpdate: (jobId: string, status: ApplicationStatus) => void;
  onBulkRemove?: (jobIds: string[]) => void;
  onBulkScore?: (jobIds: string[]) => void;
  onGenerateResume?: (job: Job) => void;
  onViewResume?: (job: Job) => void;
}

export function JobTable({ jobs, onStatusUpdate, onBulkRemove, onBulkScore, onGenerateResume, onViewResume }: JobTableProps) {
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("score-desc");
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleSelectJob = (jobId: string, checked: boolean) => {
    setSelectedJobIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(jobId);
      } else {
        newSet.delete(jobId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all visible (filtered) jobs
      const visibleJobIds = new Set(filteredAndSortedJobs.map((j) => j.id));
      setSelectedJobIds(visibleJobIds);
    } else {
      // Deselect all
      setSelectedJobIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (onBulkRemove && selectedJobIds.size > 0) {
      onBulkRemove(Array.from(selectedJobIds));
      setSelectedJobIds(new Set());
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleBulkScore = () => {
    if (onBulkScore && selectedJobIds.size > 0) {
      onBulkScore(Array.from(selectedJobIds));
      setSelectedJobIds(new Set());
    }
  };

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

    return filtered;
  }, [jobs, filterPriority, filterStatus, sortBy]);

  // Check if all visible jobs are selected
  const allVisibleSelected = useMemo(() => {
    if (filteredAndSortedJobs.length === 0) return false;
    return filteredAndSortedJobs.every((job) => selectedJobIds.has(job.id));
  }, [filteredAndSortedJobs, selectedJobIds]);

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
          <div className="min-w-[200px]">
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

          <div className="min-w-[200px]">
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

          <div className="min-w-[200px]">
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

        {/* Bulk Actions */}
        {selectedJobIds.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-medium text-gray-700">
                {selectedJobIds.size} job{selectedJobIds.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2 flex-1 justify-end">
                {onBulkScore && (
                  <Button
                    onClick={handleBulkScore}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Score Selected
                  </Button>
                )}
                {onBulkRemove && (
                  <Button
                    onClick={() => setBulkDeleteDialogOpen(true)}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-4 text-center w-12">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all jobs"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Job Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Company
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Salary
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
              {filteredAndSortedJobs.map((job, index) => {
                const isExpanded = expandedJobs.has(job.id);
                const isSelected = selectedJobIds.has(job.id);
                return (
                  <React.Fragment key={job.id}>
                    <tr
                      className={`border-t border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer ${
                        isExpanded ? "bg-blue-50" : ""
                      }`}
                      onClick={() => toggleJobExpansion(job.id)}
                    >
                          <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectJob(job.id, checked as boolean)}
                              aria-label={`Select ${job.title}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <ChevronDown
                                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                              <div className="font-semibold text-gray-900 text-sm">
                                {job.title}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {job.company}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {job.location}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {job.salary || "Not specified"}
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
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
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
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2 justify-end">
                              {job.tailoredResume && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewResume?.(job);
                                  }}
                                  className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              )}
                              {onGenerateResume && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onGenerateResume(job);
                                  }}
                                  className="hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
                                >
                                  <Sparkles className="w-4 h-4" />
                                </Button>
                              )}
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
                    {isExpanded && (
                      <tr className="border-t border-gray-100 bg-gray-50">
                          <td colSpan={9} className="px-6 py-6">
                            {job.score !== undefined ? (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left column: Score Breakdown */}
                                <div className="bg-white rounded-lg p-6 border border-gray-200">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Score Breakdown
                                  </h3>
                                  <ScoreBreakdown
                                    score={job.score}
                                    scoreBreakdown={job.scoreBreakdown}
                                  />
                                </div>

                                {/* Right column: Agent Analysis */}
                                <div className="space-y-4">
                                  {/* Agent Reasoning */}
                                  {job.reasoning && (
                                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                        Agent Reasoning
                                      </h3>
                                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {job.reasoning}
                                      </p>
                                    </div>
                                  )}

                                  {/* Skill Gaps */}
                                  {job.gaps && job.gaps.length > 0 && (
                                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-amber-600" />
                                        Skill Gaps
                                      </h3>
                                      <ul className="space-y-2">
                                        {job.gaps.map((gap, idx) => (
                                          <li
                                            key={idx}
                                            className="text-sm text-gray-700 flex items-start gap-2"
                                          >
                                            <span className="text-amber-600 mt-0.5">•</span>
                                            <span>{gap}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Job Description */}
                                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                      Job Description
                                    </h3>
                                    <div className="text-sm text-gray-700 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                                      {job.description}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                                <p className="text-gray-600">
                                  This job hasn&apos;t been scored yet. Use the Score Jobs feature to analyze this position.
                                </p>
                              </div>
                            )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <div className="text-center text-sm text-gray-600">
        Showing {filteredAndSortedJobs.length} of {jobs.length} jobs
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedJobIds.size} job{selectedJobIds.size !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {selectedJobIds.size} job{selectedJobIds.size !== 1 ? 's' : ''} from your saved jobs.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedJobIds.size} Job{selectedJobIds.size !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
