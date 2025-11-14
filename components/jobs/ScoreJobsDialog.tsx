"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Target, AlertCircle, Loader2 } from "lucide-react";
import type { Job } from "@/types/job";
import type { UserProfile } from "@/types/profile";

interface ScoreJobsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScoreComplete?: () => void;
}

export function ScoreJobsDialog({
  open,
  onOpenChange,
  onScoreComplete,
}: ScoreJobsDialogProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [phase, setPhase] = useState<'selection' | 'scoring'>('selection');
  const [error, setError] = useState<string | null>(null);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const selectedJobIdsRef = useRef<Set<string>>(new Set());

  // Load jobs and profile when dialog opens
  useEffect(() => {
    if (open) {
      loadJobsAndProfile();
    }
  }, [open]);

  const loadJobsAndProfile = async () => {
    try {
      // Fetch jobs from API
      const jobsResponse = await fetch('/api/jobs', {
        credentials: 'include',
      });
      const jobsData = await jobsResponse.json();
      const savedJobs = jobsData.jobs || [];

      // Fetch profile from API
      const profileResponse = await fetch('/api/profile', {
        credentials: 'include',
      });
      const profileData = await profileResponse.json();
      const userProfile = profileData.profile;

      setJobs(savedJobs);
      setProfile(userProfile);

      // Reset state
      setPhase('selection');
      setError(null);

      // Initialize selection with unscored jobs (jobs without a score)
      const unscoredJobIds = savedJobs
        .filter((job: Job) => job.score === undefined)
        .map((job: Job) => job.id);
      const initialSelection = new Set<string>(unscoredJobIds);
      setSelectedJobIds(initialSelection);
      selectedJobIdsRef.current = initialSelection;

      // Validation
      if (!userProfile) {
        setError("No profile found. Please create your profile first.");
      } else if (savedJobs.length === 0) {
        setError("No saved jobs found. Please save some jobs first.");
      }
    } catch (err) {
      console.error('Error loading jobs and profile:', err);
      setError("Failed to load data. Please try again.");
    }
  };

  // Setup useChat for Matching Agent
  const { messages, sendMessage, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/match',
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        // Inject only selected jobs and profile into request body
        const body = JSON.parse(init?.body as string || '{}');

        // Fetch jobs from API
        const jobsResponse = await fetch('/api/jobs', {
          credentials: 'include',
        });
        const jobsData = await jobsResponse.json();
        const allJobs = jobsData.jobs || [];

        // Read from ref to get the current selection (avoids stale closure)
        const selectedJobs = allJobs.filter((job: Job) => selectedJobIdsRef.current.has(job.id));

        // Fetch profile from API
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

  // Watch for tool results (scored jobs)
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;

    const parts = (lastMessage as any).parts || [];

    parts.forEach((part: any) => {
      const toolOutput = part.result || part.output;

      if (toolOutput?.action === 'scored' && toolOutput.scoredJobs) {
        // Scores are already saved to Supabase by the score-jobs tool

        // Notify parent to refresh from Supabase
        if (onScoreComplete) {
          onScoreComplete();
        }

        // Close the dialog automatically
        handleClose();
      }
    });
  }, [messages]);

  const handleScore = async () => {
    if (!profile || selectedJobIds.size === 0) return;

    setPhase('scoring');
    setError(null);
    setMessages([]); // Clear previous conversation

    // Send message to trigger job scoring
    sendMessage({
      text: `Please analyze and score the selected jobs against my profile.`,
    });
  };

  // Selection helper functions
  const toggleJobSelection = (jobId: string) => {
    const newSelection = new Set(selectedJobIds);
    if (newSelection.has(jobId)) {
      newSelection.delete(jobId);
    } else {
      newSelection.add(jobId);
    }
    setSelectedJobIds(newSelection);
    selectedJobIdsRef.current = newSelection;
  };

  const selectAllJobs = () => {
    const allJobIds = jobs.map(job => job.id);
    const newSelection = new Set(allJobIds);
    setSelectedJobIds(newSelection);
    selectedJobIdsRef.current = newSelection;
  };

  const deselectAllJobs = () => {
    const newSelection = new Set<string>();
    setSelectedJobIds(newSelection);
    selectedJobIdsRef.current = newSelection;
  };

  const selectOnlyUnscored = () => {
    const unscoredJobIds = jobs
      .filter(job => job.score === undefined)
      .map(job => job.id);
    const newSelection = new Set(unscoredJobIds);
    setSelectedJobIds(newSelection);
    selectedJobIdsRef.current = newSelection;
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after closing animation
    setTimeout(() => {
      setPhase('selection');
      setError(null);
      setMessages([]);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        {phase === 'scoring' ? (
          <>
            {/* Progress State - Analyzing Jobs */}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Scoring Jobs
              </DialogTitle>
              <DialogDescription>
                Analyzing {selectedJobIds.size} job{selectedJobIds.size !== 1 ? 's' : ''} against your profile
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center space-y-6 max-w-md">
                {/* Animated Spinner */}
                <div className="flex justify-center">
                  <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                </div>

                {/* Status Text */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Analyzing {selectedJobIds.size} job{selectedJobIds.size !== 1 ? 's' : ''}...
                  </h3>
                  <p className="text-sm text-gray-600">
                    Please wait while the AI analyzes your selected jobs against your profile.
                    This may take a moment.
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Initial State - Ready to Score */}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Score Your Saved Jobs
              </DialogTitle>
              <DialogDescription>
                Get AI-powered fit analysis for all your saved jobs
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-6 py-4">
              {/* Validation Checks */}
              {error ? (
                <div className="p-6 border-2 border-red-200 bg-red-50 rounded-lg text-center">
                  <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 font-medium mb-2">{error}</p>
                  <p className="text-sm text-red-600">
                    {!profile && "Create your profile to enable job scoring."}
                    {profile && jobs.length === 0 && "Save some jobs from the chat to score them."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Profile Info */}
                  {profile && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Your Profile</h3>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p><span className="font-medium">Name:</span> {profile.name}</p>
                        <p><span className="font-medium">Skills:</span> {profile.skills.join(', ')}</p>
                        <p><span className="font-medium">Preferred Locations:</span> {profile.preferredLocations.join(', ')}</p>
                      </div>
                    </div>
                  )}

                  {/* Jobs to Score */}
                  {jobs.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          Jobs to Score ({selectedJobIds.size} selected / {jobs.length} total)
                        </h3>
                      </div>

                      {/* Selection Helper Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllJobs}
                          className="text-xs"
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={deselectAllJobs}
                          className="text-xs"
                        >
                          Deselect All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectOnlyUnscored}
                          className="text-xs"
                        >
                          Only Unscored
                        </Button>
                      </div>

                      {/* Job List with Checkboxes */}
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {jobs.map((job) => (
                          <div
                            key={job.id}
                            className={`p-3 border rounded-lg transition-colors ${
                              selectedJobIds.has(job.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={selectedJobIds.has(job.id)}
                                onCheckedChange={() => toggleJobSelection(job.id)}
                                className="mt-1"
                              />
                              <div className="flex-1 flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900">{job.title}</h4>
                                  <p className="text-sm text-gray-600">{job.company}</p>
                                  <p className="text-xs text-gray-500">{job.location}</p>
                                </div>
                                {job.score !== undefined ? (
                                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-300">
                                    Score: {job.score}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="ml-2 bg-gray-50 text-gray-600 border-gray-300">
                                    Not scored
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scoring Info */}
                  {profile && jobs.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">Scoring Methodology</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Jobs will be scored on a 0-100 scale using your configured weights:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Salary Match:</span>
                          <span className="font-medium">{profile.scoringWeights?.salaryMatch || 30}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location Fit:</span>
                          <span className="font-medium">{profile.scoringWeights?.locationFit || 20}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Company Appeal:</span>
                          <span className="font-medium">{profile.scoringWeights?.companyAppeal || 25}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Role Match:</span>
                          <span className="font-medium">{profile.scoringWeights?.roleMatch || 15}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Requirements Fit:</span>
                          <span className="font-medium">{profile.scoringWeights?.requirementsFit || 10}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleScore}
                disabled={!!error || selectedJobIds.size === 0 || !profile}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Target className="w-4 h-4 mr-2" />
                Score {selectedJobIds.size} Job{selectedJobIds.size !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
