/**
 * Jobs Save API Route
 *
 * POST /api/jobs/save
 * Saves jobs to Supabase database.
 * Used by the save-jobs AI agent tool.
 */

import { createClient } from "@/lib/supabase/server";
import { saveJobs } from "@/lib/supabase/queries";
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
    const { jobs }: { jobs: Job[] } = await request.json();

    if (!jobs || !Array.isArray(jobs)) {
      return NextResponse.json({ error: "Invalid jobs data" }, { status: 400 });
    }

    // Save jobs to database
    const success = await saveJobs(supabase, user.id, jobs);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to save jobs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: jobs.length });
  } catch (error) {
    console.error("Jobs save API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
