/**
 * Job Status Update API Route
 *
 * PATCH /api/jobs/:id/status
 * Updates job application status.
 */

import { createClient } from "@/lib/supabase/server";
import { updateJobStatus } from "@/lib/supabase/queries";
import type { ApplicationStatus } from "@/types/job";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: jobId } = await params;
    const { status }: { status: ApplicationStatus } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Update job status
    const success = await updateJobStatus(supabase, user.id, jobId, status);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update job status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Job status update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
