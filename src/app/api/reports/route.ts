import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { applyRateLimitHeaders, getClientIp } from "@/lib/request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { reportSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const rateLimit = checkRateLimit({
      key: `report:create:${user.id}:${getClientIp(request)}`,
      limit: 5,
      windowMs: 10 * 60_000,
    });

    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: "Too many reports submitted in a short time. Please wait before sending another." },
          { status: 429 },
        ),
        rateLimit,
      );
    }

    const body = await request.json();
    const parsed = reportSchema.parse(body);
    const admin = createSupabaseAdminClient();

    const { data: report, error } = await admin
      .from("reports")
      .insert({
        reporter_id: user.id,
        reported_user_id: parsed.reportedUserId ?? null,
        experience_id: parsed.experienceId ?? null,
        bid_id: parsed.bidId ?? null,
        reason: parsed.reason,
        details: parsed.details ?? null,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    await admin.from("moderation_queue").insert({
      report_id: report.id,
      priority: "normal",
    });

    return applyRateLimitHeaders(NextResponse.json({ report }), rateLimit);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit report." },
      { status: 400 },
    );
  }
}
