import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { logDevelopmentError } from "@/lib/errors";
import { validateGooglePlaceId } from "@/lib/places";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { experienceSchema } from "@/lib/validators";

function getExperienceValidationMessage(error: z.ZodError) {
  const issue = error.issues[0];
  const field = issue?.path.join(".");

  if (field === "locationPlaceId") {
    return "Choose a valid address from the Google suggestions before publishing.";
  }

  if (field === "description") {
    return "Description must be at least 30 characters.";
  }

  if (field === "title") {
    return "Title must be at least 4 characters.";
  }

  return issue?.message ?? "Check the experience details and try again.";
}

function getExperienceCreateErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Select a valid Google Maps address.")) {
    return "Choose a valid address from the Google suggestions before publishing.";
  }

  if (message.includes("Address validation")) {
    return "Address validation is unavailable. Please try again later.";
  }

  return "Unable to create experience.";
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const experienceResult = experienceSchema.safeParse(body);

    if (!experienceResult.success) {
      return NextResponse.json({ error: getExperienceValidationMessage(experienceResult.error) }, { status: 400 });
    }

    const parsed = experienceResult.data;
    const place = await validateGooglePlaceId(parsed.locationPlaceId);
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from("experiences")
      .insert({
        user_id: user.id,
        title: parsed.title,
        description: parsed.description,
        location: place.formattedAddress,
        location_place_id: place.placeId,
        location_latitude: place.latitude,
        location_longitude: place.longitude,
        location_city: place.city,
        location_province: place.province,
        location_country: place.country,
        vibe_summary: parsed.vibeSummary,
        date_window_start: parsed.dateWindowStart || null,
        date_window_end: parsed.dateWindowEnd || null,
        budget_min_cents: parsed.startingBidCents || null,
        budget_max_cents: null,
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
    logDevelopmentError("experiences:create", error);

    return NextResponse.json(
      { error: getExperienceCreateErrorMessage(error) },
      { status: 400 },
    );
  }
}
