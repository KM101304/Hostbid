import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { locationUpdateSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const parsed = locationUpdateSchema.parse(await request.json());
    const admin = createSupabaseAdminClient();

    const { data: share } = await admin
      .from("location_shares")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!share) {
      throw new Error("Location share is not active.");
    }

    const { error } = await admin
      .from("location_shares")
      .update({
        last_latitude: parsed.latitude,
        last_longitude: parsed.longitude,
        last_accuracy_meters: parsed.accuracyMeters ?? null,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update location." },
      { status: 400 },
    );
  }
}
