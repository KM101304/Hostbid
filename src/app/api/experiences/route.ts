import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { experienceSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = experienceSchema.parse(body);
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from("experiences")
      .insert({
        user_id: user.id,
        title: parsed.title,
        description: parsed.description,
        location: parsed.location,
        vibe_summary: parsed.vibeSummary,
        date_window_start: parsed.dateWindowStart || null,
        date_window_end: parsed.dateWindowEnd || null,
        budget_min_cents: parsed.budgetMinCents || null,
        budget_max_cents: parsed.budgetMaxCents || null,
        expires_at: parsed.expiresAt || null,
        safety_preferences: parsed.safetyPreferences,
        status: "open",
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ experience: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create experience." },
      { status: 400 },
    );
  }
}
