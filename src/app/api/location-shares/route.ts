import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getAppUrl } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { locationShareSchema } from "@/lib/validators";

function createShareToken() {
  return randomBytes(24).toString("base64url");
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = locationShareSchema.parse(await request.json());
    const admin = createSupabaseAdminClient();
    const expiresAt = new Date(Date.now() + parsed.durationMinutes * 60_000).toISOString();
    const token = createShareToken();

    const { data, error } = await admin
      .from("location_shares")
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    const origin = new URL(request.url).origin || getAppUrl();

    return NextResponse.json({
      share: {
        id: data.id,
        token: data.token,
        expiresAt: data.expires_at,
        shareUrl: `${origin}/safety/location/${data.token}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create location share." },
      { status: 400 },
    );
  }
}
