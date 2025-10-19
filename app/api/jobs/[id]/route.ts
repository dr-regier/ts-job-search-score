/**
 * Job Management API Route
 *
 * DELETE /api/jobs/:id - Delete a job
 * PATCH /api/jobs/:id - Update job (notes, resume, etc.)
 */

import { createClient } from "@/lib/supabase/server";
import { deleteJob, updateJobNotes, saveJobResume } from "@/lib/supabase/queries";
import type { Job } from "@/types/job";
import { NextResponse } from "next/server";

export async function DELETE(
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

    // Delete job
    const success = await deleteJob(supabase, user.id, jobId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete job" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Job delete API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const body: { notes?: string; tailoredResume?: Job["tailoredResume"] } = await request.json();

    // Update notes if provided
    if (body.notes !== undefined) {
      const success = await updateJobNotes(supabase, user.id, jobId, body.notes);
      if (!success) {
        return NextResponse.json(
          { error: "Failed to update job notes" },
          { status: 500 }
        );
      }
    }

    // Update tailored resume if provided
    if (body.tailoredResume !== undefined) {
      const success = await saveJobResume(supabase, user.id, jobId, body.tailoredResume);
      if (!success) {
        return NextResponse.json(
          { error: "Failed to save tailored resume" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Job update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
