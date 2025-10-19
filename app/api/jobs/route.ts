/**
 * Jobs API Route
 *
 * GET /api/jobs - Get all jobs for authenticated user
 */

import { createClient } from "@/lib/supabase/server";
import { getJobs } from "@/lib/supabase/queries";
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

    // Get jobs from database
    const jobs = await getJobs(supabase, user.id);

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Jobs get API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
