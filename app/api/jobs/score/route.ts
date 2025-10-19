/**
 * Jobs Score API Route
 *
 * POST /api/jobs/score
 * Updates jobs with scoring data.
 * Used by the score-jobs AI agent tool.
 */

import { createClient } from "@/lib/supabase/server";
import { updateJobsWithScores } from "@/lib/supabase/queries";
import type { Job } from "@/types/job";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { scoredJobs }: { scoredJobs: Job[] } = await request.json();

    if (!scoredJobs || !Array.isArray(scoredJobs)) {
      return NextResponse.json(
        { error: "Invalid scored jobs data" },
        { status: 400 }
      );
    }

    // Update jobs with scores in database
    const success = await updateJobsWithScores(supabase, user.id, scoredJobs);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update jobs with scores" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: scoredJobs.length });
  } catch (error) {
    console.error("Jobs score API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
