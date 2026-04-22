import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const blockSchema = z.object({
  blockedId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = blockSchema.parse(body);
    const admin = createSupabaseAdminClient();

    if (parsed.blockedId === user.id) {
      throw new Error("You cannot block yourself.");
    }

    const { data, error } = await admin
      .from("blocks")
      .insert({
        blocker_id: user.id,
        blocked_id: parsed.blockedId,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ block: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to block user." },
      { status: 400 },
    );
  }
}
