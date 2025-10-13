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
import { getProfile, saveProfile } from "@/lib/storage/profile";
import { DEFAULT_SCORING_WEIGHTS, validateScoringWeights } from "@/types/profile";
import type { UserProfile } from "@/types/profile";

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
  const [existingProfile, setExistingProfile] = useState<UserProfile | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Load existing profile on mount
  useEffect(() => {
    const profile = getProfile();
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
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    // Validate scoring weights
    if (!validateScoringWeights(weights)) {
      alert("Scoring weights must sum to exactly 100%");
      return;
    }

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

    saveProfile(profile);
    setSuccessMessage("Profile saved successfully!");
    setExistingProfile(profile);

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(null), 3000);
  };

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
