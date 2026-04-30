import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { logDevelopmentError } from "@/lib/errors";
import { computeProfileQualityScore } from "@/lib/marketplace";
import { validateGooglePlaceId } from "@/lib/places";
import { checkRateLimit } from "@/lib/rate-limit";
import { applyRateLimitHeaders, getClientIp } from "@/lib/request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { profileSchema } from "@/lib/validators";

function getProfileValidationMessage(error: z.ZodError) {
  const issue = error.issues[0];
  const field = issue?.path.join(".");

  if (field === "bio" && issue?.code === "too_small") {
    return "Bio must be at least 20 characters.";
  }

  if (field === "locationPlaceId") {
    return "Choose a valid address from the Google suggestions before saving.";
  }

  if (field === "age") {
    return "Age must be a whole number between 18 and 100.";
  }

  if (field === "fullName") {
    return "Name needs to be at least 2 characters.";
  }

  if (field === "photoUrls" || field?.startsWith("photoUrls.")) {
    return "One of the profile photos is not a valid uploaded photo URL.";
  }

  return issue?.message ?? "Check your profile fields and try again.";
}

function getProfileSaveErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Select a valid Google Maps address.")) {
    return "Choose a valid address from the Google suggestions before saving.";
  }

  if (message.includes("Address validation")) {
    return "Address validation is unavailable. Please try again later.";
  }

  return "We could not save your profile. Please check the fields and try again.";
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const rateLimit = checkRateLimit({
      key: `profile:update:${user.id}:${getClientIp(request)}`,
      limit: 12,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: "Too many profile updates. Please wait a minute before saving again." },
          { status: 429 },
        ),
        rateLimit,
      );
    }

    const body = await request.json();
    const profileResult = profileSchema.safeParse(body);

    if (!profileResult.success) {
      return applyRateLimitHeaders(
        NextResponse.json({ error: getProfileValidationMessage(profileResult.error) }, { status: 400 }),
        rateLimit,
      );
    }

    const parsed = profileResult.data;
    const place = await validateGooglePlaceId(parsed.locationPlaceId);
    const admin = createSupabaseAdminClient();
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("stripe_connect_account_id, is_verified, verification_status")
      .eq("id", user.id)
      .maybeSingle();

    const qualityScore = computeProfileQualityScore({
      full_name: parsed.fullName,
      age: parsed.age,
      bio: parsed.bio,
      location: place.formattedAddress,
      avatar_url: parsed.avatarUrl || null,
      photo_urls: parsed.photoUrls,
      is_verified: existingProfile?.is_verified ?? false,
      verification_status: existingProfile?.verification_status ?? (existingProfile?.is_verified ? "verified" : "not_started"),
    });

    const { data, error } = await admin
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: parsed.fullName,
        age: parsed.age,
        bio: parsed.bio,
        location: place.formattedAddress,
        location_place_id: place.placeId,
        location_latitude: place.latitude,
        location_longitude: place.longitude,
        location_city: place.city,
        location_province: place.province,
        location_country: place.country,
        avatar_url: parsed.avatarUrl || null,
        photo_urls: parsed.photoUrls,
        stripe_connect_account_id: existingProfile?.stripe_connect_account_id ?? (parsed.stripeConnectAccountId || null),
        verification_status: existingProfile?.verification_status ?? (existingProfile?.is_verified ? "verified" : "not_started"),
        quality_score: qualityScore,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return applyRateLimitHeaders(NextResponse.json({ profile: data }), rateLimit);
  } catch (error) {
    logDevelopmentError("profile:update", error);

    return NextResponse.json(
      { error: getProfileSaveErrorMessage(error) },
      { status: 400 },
    );
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    logDevelopmentError("profile:get", error);

    return NextResponse.json(
      { error: "Unable to fetch profile." },
      { status: 400 },
    );
  }
}
