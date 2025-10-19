/**
 * Resume Management API Route
 *
 * GET /api/resumes/:id - Get resume content
 * PATCH /api/resumes/:id - Update resume name or content
 * DELETE /api/resumes/:id - Delete resume
 */

import { createClient } from "@/lib/supabase/server";
import {
  getResumeContent,
  deleteResume,
  updateResumeName,
  updateResumeContent,
} from "@/lib/supabase/queries";
import { NextResponse } from "next/server";

export async function GET(
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

    const { id: resumeId } = await params;

    // Get resume content
    const content = await getResumeContent(supabase, user.id, resumeId);

    if (!content) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Resume get API error:", error);
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

    const { id: resumeId } = await params;
    const body: { name?: string; content?: string } = await request.json();

    // Update name if provided
    if (body.name !== undefined) {
      const success = await updateResumeName(
        supabase,
        user.id,
        resumeId,
        body.name
      );
      if (!success) {
        return NextResponse.json(
          { error: "Failed to update resume name" },
          { status: 500 }
        );
      }
    }

    // Update content if provided
    if (body.content !== undefined) {
      const success = await updateResumeContent(
        supabase,
        user.id,
        resumeId,
        body.content
      );
      if (!success) {
        return NextResponse.json(
          { error: "Failed to update resume content" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resume update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { id: resumeId } = await params;

    // Delete resume
    const success = await deleteResume(supabase, user.id, resumeId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete resume" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resume delete API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
