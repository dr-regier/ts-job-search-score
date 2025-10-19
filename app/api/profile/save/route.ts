/**
 * Profile Save API Route
 *
 * POST /api/profile/save
 * Saves user profile to Supabase database.
 */

import { createClient } from "@/lib/supabase/server";
import { saveProfile } from "@/lib/supabase/queries";
import type { UserProfile } from "@/types/profile";
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
    const body = await request.json();
    const profile: UserProfile = body.profile || body;

    // Save profile to database
    const success = await saveProfile(supabase, user.id, profile);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to save profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Profile save API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
