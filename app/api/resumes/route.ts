/**
 * Resumes API Route
 *
 * GET /api/resumes - Get all resumes for authenticated user
 */

import { createClient } from "@/lib/supabase/server";
import { getResumes } from "@/lib/supabase/queries";
import { NextResponse } from "next/server";

export async function GET() {
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

    // Get resumes from database
    const resumes = await getResumes(supabase, user.id);

    return NextResponse.json({ resumes });
  } catch (error) {
    console.error("Resumes get API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
