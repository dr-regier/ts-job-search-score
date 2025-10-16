"use client";

import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import type { Job } from "@/types/job";
import type { Resume } from "@/types/resume";
import { getResumes } from "@/lib/storage/resumes";

interface GenerateResumeDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateResumeDialog({
  job,
  open,
  onOpenChange,
}: GenerateResumeDialogProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load resumes when dialog opens
  useEffect(() => {
    if (open) {
      const userResumes = getResumes();
      setResumes(userResumes);

      // Reset state
      setSelectedResumeId("");
      setGeneratedResume(null);
      setCopySuccess(false);
    }
  }, [open]);

  // Setup useChat for Resume Generator Agent
  const { messages, sendMessage, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/resume',
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        // Inject jobId and masterResumeId into request body
        const body = JSON.parse(init?.body as string || '{}');
        const enhancedBody = {
          ...body,
          jobId: job?.id,
          masterResumeId: selectedResumeId,
        };

        return fetch(input, {
          ...init,
          body: JSON.stringify(enhancedBody),
        });
      },
    }),
  });

  // Watch for tool results (generated resume)
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;

    const parts = (lastMessage as any).parts || [];

    parts.forEach((part: any) => {
      const toolOutput = part.result || part.output;

      if (toolOutput?.action === 'generated' && toolOutput.tailoredResume) {
        console.log('📝 Generated resume received:', toolOutput);
        setGeneratedResume(toolOutput);
        setIsGenerating(false);
      }
    });
  }, [messages]);

  const handleGenerate = async () => {
    if (!selectedResumeId) return;

    setIsGenerating(true);
    setGeneratedResume(null);
    setMessages([]); // Clear previous conversation

    // Send message to trigger resume generation
    sendMessage({
      text: `Generate a tailored resume for this job using the selected master resume.`,
    });
  };

  const handleCopy = async () => {
    if (!generatedResume?.tailoredResume?.content) return;

    try {
      await navigator.clipboard.writeText(generatedResume.tailoredResume.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    if (!generatedResume?.tailoredResume?.content) return;

    const blob = new Blob([generatedResume.tailoredResume.content], {
      type: 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job?.company}_${job?.title}_Resume.md`.replace(/[^a-zA-Z0-9_-]/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRegenerate = () => {
    setGeneratedResume(null);
    handleGenerate();
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        {!generatedResume ? (
          <>
            {/* Selection Phase */}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Generate Tailored Resume
              </DialogTitle>
              <DialogDescription>
                Create a customized resume for this job opportunity
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-6 py-4">
              {/* Job Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {job.title}
                    </h3>
                    <p className="text-gray-600">{job.company}</p>
                    <p className="text-sm text-gray-500 mt-1">{job.location}</p>
                  </div>
                  {job.score && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {job.score}
                      </div>
                      <div className="text-xs text-gray-500">Match Score</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resume Selection */}
              <div className="space-y-3">
                <Label htmlFor="resume-select">
                  Select Master Resume <span className="text-red-500">*</span>
                </Label>
                {resumes.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">No resumes in your library</p>
                    <p className="text-sm text-gray-500">
                      Upload a resume first to generate tailored versions
                    </p>
                  </div>
                ) : (
                  <Select
                    value={selectedResumeId}
                    onValueChange={setSelectedResumeId}
                  >
                    <SelectTrigger id="resume-select">
                      <SelectValue placeholder="Choose a resume to customize" />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes.map((resume) => (
                        <SelectItem key={resume.id} value={resume.id}>
                          📄 {resume.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-gray-500">
                  The AI will tailor this resume to emphasize relevant experience for this job
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!selectedResumeId || isGenerating || resumes.length === 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Resume
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Generated Resume Display */}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Tailored Resume Generated
              </DialogTitle>
              <DialogDescription>
                Based on {generatedResume.tailoredResume.masterResumeName} for{" "}
                {generatedResume.tailoredResume.targetJob.title}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-6 py-4">
              {/* Match Analysis */}
              {generatedResume.matchAnalysis && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Match Analysis</h3>
                    <Badge className="bg-blue-600 text-white">
                      {generatedResume.matchAnalysis.alignmentScore}% Alignment
                    </Badge>
                  </div>

                  {generatedResume.matchAnalysis.addressedRequirements?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        ✅ Addressed Requirements:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {generatedResume.matchAnalysis.addressedRequirements.map((req: string, i: number) => (
                          <li key={i}>• {req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {generatedResume.matchAnalysis.remainingGaps?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        ⚠️ Remaining Gaps:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {generatedResume.matchAnalysis.remainingGaps.map((gap: string, i: number) => (
                          <li key={i}>• {gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Changes Made */}
              {generatedResume.changes?.length > 0 && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    ✨ Changes Made ({generatedResume.changes.length})
                  </h3>
                  <ul className="space-y-2">
                    {generatedResume.changes.map((change: any, i: number) => (
                      <li key={i} className="text-sm text-gray-700">
                        <span className="font-medium capitalize">{change.type}:</span>{" "}
                        {change.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resume Content */}
              <div className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Resume Content</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopy}
                      className="text-xs"
                    >
                      {copySuccess ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownload}
                      className="text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="p-6 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                    {generatedResume.tailoredResume.content}
                  </pre>
                </div>
              </div>

              {/* Recommendations */}
              {generatedResume.matchAnalysis?.recommendations?.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    💡 Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {generatedResume.matchAnalysis.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                variant="outline"
                onClick={handleRegenerate}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
