/**
 * Profile API Route
 *
 * GET /api/profile - Get user profile
 */

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries";
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

    // Get profile from database
    const profile = await getProfile(supabase, user.id);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile get API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
