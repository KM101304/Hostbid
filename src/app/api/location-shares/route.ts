import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getAppUrl } from "@/lib/env";
import { createLocationShareToken, saveLocationShare } from "@/lib/location-shares";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { locationShareSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = locationShareSchema.parse(await request.json());
    const admin = createSupabaseAdminClient();
    const expiresAt = new Date(Date.now() + parsed.durationMinutes * 60_000).toISOString();
    const token = createLocationShareToken();
    const { data: profile } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();

    const share = await saveLocationShare({
      id: token,
      token,
      userId: user.id,
      userName: profile?.full_name ?? user.email ?? null,
      expiresAt,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLatitude: null,
      lastLongitude: null,
      lastAccuracyMeters: null,
      lastSeenAt: null,
    });

    const origin = new URL(request.url).origin || getAppUrl();

    return NextResponse.json({
      share: {
        id: share.id,
        token: share.token,
        expiresAt: share.expiresAt,
        shareUrl: `${origin}/safety/location/${share.token}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create location share." },
      { status: 400 },
    );
  }
}
