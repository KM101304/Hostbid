import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { computeProfileQualityScore } from "@/lib/marketplace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { profileSchema } from "@/lib/validators";

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
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
      is_verified: parsed.isVerified,
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
        is_verified: parsed.isVerified,
        stripe_connect_account_id: parsed.stripeConnectAccountId || null,
        quality_score: qualityScore,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ profile: data });
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
