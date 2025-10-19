/**
 * Resume Upload API Route
 *
 * POST /api/resumes/upload
 * Uploads resume file to Supabase Storage and saves metadata.
 */

import { createClient } from "@/lib/supabase/server";
import { uploadResume } from "@/lib/supabase/queries";
import type { ResumeFormat } from "@/types/resume";
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

    // Parse form data
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const content = formData.get("content") as string;
    const format = formData.get("format") as ResumeFormat;

    if (!name || !content || !format) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upload resume
    const resume = await uploadResume(supabase, user.id, name, content, format);

    if (!resume) {
      return NextResponse.json(
        { error: "Failed to upload resume" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, resume });
  } catch (error) {
    console.error("Resume upload API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
