import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { computeProfileQualityScore } from "@/lib/marketplace";
import { checkRateLimit } from "@/lib/rate-limit";
import { applyRateLimitHeaders, getClientIp } from "@/lib/request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { profileSchema } from "@/lib/validators";

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
    const parsed = profileSchema.parse(body);
    const admin = createSupabaseAdminClient();

    const qualityScore = computeProfileQualityScore({
      full_name: parsed.fullName,
      age: parsed.age,
      bio: parsed.bio,
      location: parsed.location,
      avatar_url: parsed.avatarUrl || null,
      photo_urls: parsed.photoUrls,
    });

    const { data, error } = await admin
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: parsed.fullName,
        age: parsed.age,
        bio: parsed.bio,
        location: parsed.location,
        avatar_url: parsed.avatarUrl || null,
        photo_urls: parsed.photoUrls,
        stripe_connect_account_id: parsed.stripeConnectAccountId || null,
        verification_status: parsed.verificationStatus ?? "not_started",
        verification_selfie_url: parsed.verificationSelfieUrl || null,
        verification_submitted_at:
          parsed.verificationStatus === "pending" ? new Date().toISOString() : undefined,
        quality_score: qualityScore,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return applyRateLimitHeaders(NextResponse.json({ profile: data }), rateLimit);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update profile." },
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch profile." },
      { status: 400 },
    );
  }
}
