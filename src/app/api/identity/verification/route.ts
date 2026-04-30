import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { logDevelopmentError } from "@/lib/errors";
import { computeNextVerificationScore, uploadIdentitySelfie } from "@/lib/identity";
import { checkRateLimit } from "@/lib/rate-limit";
import { applyRateLimitHeaders, getClientIp } from "@/lib/request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const user = await requireUser();
    const admin = createSupabaseAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({ profile });
  } catch (error) {
    logDevelopmentError("identity:get", error);

    return NextResponse.json(
      { error: "Unable to load identity verification." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const rateLimit = checkRateLimit({
      key: `identity:start:${user.id}:${getClientIp(request)}`,
      limit: 4,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: "Too many verification attempts. Please wait a minute before trying again." },
          { status: 429 },
        ),
        rateLimit,
      );
    }

    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();

    if (profile?.is_verified) {
      return applyRateLimitHeaders(NextResponse.json({ status: "verified" }), rateLimit);
    }

    const formData = await request.formData();
    const selfie = formData.get("selfie");

    if (!(selfie instanceof File)) {
      return applyRateLimitHeaders(
        NextResponse.json({ error: "Upload a selfie before submitting verification." }, { status: 400 }),
        rateLimit,
      );
    }

    const storedSelfiePath = await uploadIdentitySelfie(user.id, selfie);
    const submittedAt = new Date().toISOString();

    const { data, error } = await admin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          is_verified: false,
          verification_provider: "manual",
          verification_status: "pending",
          verification_selfie_url: storedSelfiePath,
          verification_submitted_at: submittedAt,
          verification_reviewed_at: null,
          quality_score: computeNextVerificationScore(profile ?? { id: user.id }, "pending"),
        },
        { onConflict: "id" },
      )
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return applyRateLimitHeaders(
      NextResponse.json({
        status: "pending",
        profile: data,
      }),
      rateLimit,
    );
  } catch (error) {
    logDevelopmentError("identity:submit", error);
    const message = error instanceof Error ? error.message : "";
    const safeMessage =
      message.startsWith("Upload ") || message.startsWith("Keep ") || message.startsWith("We could not ")
        ? message
        : "Unable to submit identity verification.";

    return NextResponse.json(
      { error: safeMessage },
      { status: 400 },
    );
  }
}
