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
import { ScoringWeights } from "./ScoringWeights";
import { DEFAULT_SCORING_WEIGHTS, validateScoringWeights } from "@/types/profile";
import type { UserProfile } from "@/types/profile";
import { Loader2 } from "lucide-react";

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
          <Label htmlFor="professionalBackground">
            Professional Background
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
          <Label htmlFor="skills">Skills</Label>
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="salaryMin">Minimum Salary ($)</Label>
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
            <Label htmlFor="salaryMax">Maximum Salary ($)</Label>
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

        {/* Preferred Locations */}
        <div className="space-y-2">
          <Label htmlFor="preferredLocations">Preferred Locations</Label>
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

        {/* Deal Breakers */}
        <div className="space-y-2">
          <Label htmlFor="dealBreakers">Deal Breakers</Label>
          <Textarea
            id="dealBreakers"
            {...register("dealBreakers")}
            placeholder="Requirements or conditions that would disqualify a job..."
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
  );
}
