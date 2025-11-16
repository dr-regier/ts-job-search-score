"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScoringWeights } from "./ScoringWeights";
import { DEFAULT_SCORING_WEIGHTS, validateScoringWeights } from "@/types/profile";
import type { UserProfile } from "@/types/profile";
import { Loader2, Info, ChevronDown } from "lucide-react";

// Zod schema for form validation
const profileSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    professionalBackground: z
      .string()
      .min(10, "Professional background must be at least 10 characters"),
    skills: z.string().min(1, "Skills are required"),
    salaryMin: z.number().min(0, "Salary minimum must be positive"),
    salaryMax: z.number().min(0, "Salary maximum must be positive"),
    preferredLocations: z.string().min(1, "Preferred locations are required"),
    jobPreferences: z.string().min(1, "Job preferences are required"),
    companyPreferences: z.string().optional(),
    dealBreakers: z.string(),
  })
  .refine((data) => data.salaryMax >= data.salaryMin, {
    message:
      "Maximum salary must be greater than or equal to minimum salary",
    path: ["salaryMax"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const [weights, setWeights] = useState<UserProfile["scoringWeights"]>({
    ...DEFAULT_SCORING_WEIGHTS,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [existingProfile, setExistingProfile] = useState<UserProfile | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Load existing profile on mount from Supabase
  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/profile', {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            setErrorMessage("Please log in to view your profile");
            return;
          }
          throw new Error('Failed to load profile');
        }

        const data = await response.json();
        const profile = data.profile;

        if (profile) {
          setExistingProfile(profile);
          setWeights(profile.scoringWeights);

          // Pre-populate form
          reset({
            name: profile.name,
            professionalBackground: profile.professionalBackground,
            skills: profile.skills.join(", "),
            salaryMin: profile.salaryMin,
            salaryMax: profile.salaryMax,
            preferredLocations: profile.preferredLocations.join(", "),
            jobPreferences: profile.jobPreferences.join(", "),
            companyPreferences: profile.companyPreferences || "",
            dealBreakers: profile.dealBreakers,
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setErrorMessage("Failed to load profile. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    // Validate scoring weights
    if (!validateScoringWeights(weights)) {
      setErrorMessage("Scoring weights must sum to exactly 100%");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    try {
      // Clear any previous messages
      setSuccessMessage(null);
      setErrorMessage(null);

      // Convert comma-separated strings to arrays
      const profile: UserProfile = {
        name: data.name,
        professionalBackground: data.professionalBackground,
        skills: data.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        preferredLocations: data.preferredLocations
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        jobPreferences: data.jobPreferences
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        companyPreferences: data.companyPreferences || undefined,
        dealBreakers: data.dealBreakers,
        scoringWeights: weights,
        updatedAt: new Date().toISOString(),
        createdVia: existingProfile?.createdVia || "form",
      };

      // Save to Supabase
      const response = await fetch('/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ profile }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please log in to save your profile");
        }
        throw new Error('Failed to save profile');
      }

      const result = await response.json();

      if (result.success) {
        setSuccessMessage("Profile saved successfully!");
        setExistingProfile(profile);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(result.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to save profile. Please try again.");
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div>
        {existingProfile?.createdVia === "chat" && (
          <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800">
              This profile was originally created via chat conversation with the
              AI agent.
            </p>
          </Card>
        )}

        {errorMessage && (
          <Card className="mb-6 p-4 bg-red-50 border-red-200">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </Card>
        )}

        {successMessage && (
          <Card className="mb-6 p-4 bg-green-50 border-green-200">
            <p className="text-sm text-green-800">{successMessage}</p>
          </Card>
        )}

        {/* How Scoring Works - Collapsible Section */}
        <Collapsible className="mb-6">
          <CollapsibleTrigger className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors">
            <Info className="w-4 h-4" />
            <span className="font-medium">How does job scoring work?</span>
            <ChevronDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm text-gray-700 mb-3">
                The Matching Agent scores jobs 0-100 based on 5 categories:
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <strong>🎯 Salary Match</strong>
                  <br />
                  → Uses: Salary Range
                  <br />→ Full points if job salary overlaps your range
                </li>
                <li>
                  <strong>📍 Location Fit</strong>
                  <br />
                  → Uses: Preferred Locations
                  <br />→ Full points if job is remote or matches your locations
                </li>
                <li>
                  <strong>🏢 Company Fit</strong>
                  <br />
                  → Uses: Company Preferences
                  <br />→ AI analyzes if company aligns with your preferences
                </li>
                <li>
                  <strong>💼 Role Match</strong>
                  <br />
                  → Uses: Professional Background
                  <br />→ AI checks if job title/level matches your experience
                </li>
                <li>
                  <strong>✅ Requirements Fit</strong>
                  <br />
                  → Uses: Skills, Professional Background
                  <br />→ AI calculates what % of requirements you meet
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3 italic">
                💡 Tip: Fill out Professional Background, Skills, and Company
                Preferences thoroughly for the most accurate scoring!
              </p>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Your full name"
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Professional Background */}
        <div className="space-y-2">
          <Label htmlFor="professionalBackground" className="flex items-center gap-2">
            Professional Background
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Critical for scoring - AI analyzes experience level and seniority for
                  Role Match and Requirements Fit. Think LinkedIn "About" section.
                </p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Textarea
            id="professionalBackground"
            {...register("professionalBackground")}
            placeholder="Describe your experience, education, and career history..."
            rows={5}
          />
          {errors.professionalBackground && (
            <p className="text-sm text-red-600">
              {errors.professionalBackground.message}
            </p>
          )}
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <Label htmlFor="skills" className="flex items-center gap-2">
            Skills
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Critical for scoring - used to calculate Requirements Fit (what % of job
                  requirements you meet). Be thorough!
                </p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="skills"
            {...register("skills")}
            placeholder="Python, React, AWS, Machine Learning (comma-separated)"
          />
          {errors.skills && (
            <p className="text-sm text-red-600">{errors.skills.message}</p>
          )}
        </div>

        {/* Salary Range */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Salary Range
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Critical for scoring - jobs within your range get full points for Salary
                  Match.
                </p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryMin" className="text-sm text-gray-600">Minimum ($)</Label>
              <Input
                id="salaryMin"
                type="number"
                {...register("salaryMin", { valueAsNumber: true })}
                placeholder="80000"
              />
              {errors.salaryMin && (
                <p className="text-sm text-red-600">{errors.salaryMin.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryMax" className="text-sm text-gray-600">Maximum ($)</Label>
              <Input
                id="salaryMax"
                type="number"
                {...register("salaryMax", { valueAsNumber: true })}
                placeholder="150000"
              />
              {errors.salaryMax && (
                <p className="text-sm text-red-600">{errors.salaryMax.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Preferred Locations */}
        <div className="space-y-2">
          <Label htmlFor="preferredLocations" className="flex items-center gap-2">
            Preferred Locations
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Critical for scoring - matching locations get full points for Location Fit.
                </p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="preferredLocations"
            {...register("preferredLocations")}
            placeholder="Remote, San Francisco, New York (comma-separated)"
          />
          {errors.preferredLocations && (
            <p className="text-sm text-red-600">
              {errors.preferredLocations.message}
            </p>
          )}
        </div>

        {/* Job Preferences */}
        <div className="space-y-2">
          <Label htmlFor="jobPreferences">Job Preferences</Label>
          <Input
            id="jobPreferences"
            {...register("jobPreferences")}
            placeholder="Full-time, Remote, Flexible hours (comma-separated)"
          />
          {errors.jobPreferences && (
            <p className="text-sm text-red-600">
              {errors.jobPreferences.message}
            </p>
          )}
        </div>

        {/* Company Preferences - NEW */}
        <div className="space-y-2">
          <Label htmlFor="companyPreferences" className="flex items-center gap-2">
            What makes a company appealing to you? (optional)
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Describe your ideal company - industries, size, culture, values. Used for
                  Company Fit scoring.
                </p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Textarea
            id="companyPreferences"
            {...register("companyPreferences")}
            placeholder="e.g., I prefer remote-first companies in fintech or climate tech with strong engineering cultures and good work-life balance. I'm drawn to mission-driven startups (Series B+) or established tech companies with good reputations."
            rows={4}
          />
          {errors.companyPreferences && (
            <p className="text-sm text-red-600">
              {errors.companyPreferences.message}
            </p>
          )}
        </div>

        {/* Deal Breakers */}
        <div className="space-y-2">
          <Label htmlFor="dealBreakers" className="flex items-center gap-2">
            Deal Breakers (optional)
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Jobs matching these criteria will be flagged and scored lower. Be specific
                  about hard limits.
                </p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Textarea
            id="dealBreakers"
            {...register("dealBreakers")}
            placeholder="e.g., No travel >25%, No on-call rotations, No crypto/Web3 companies, Must be fully remote"
            rows={3}
          />
          {errors.dealBreakers && (
            <p className="text-sm text-red-600">
              {errors.dealBreakers.message}
            </p>
          )}
        </div>

        {/* Scoring Weights */}
        <ScoringWeights weights={weights} onChange={setWeights} />

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Saving..." : "Save Profile"}
        </Button>
      </form>
      </div>
    </TooltipProvider>
  );
}
