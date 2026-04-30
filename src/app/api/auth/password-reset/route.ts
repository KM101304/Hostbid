import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppUrl } from "@/lib/env";
import { buildAuthEmailHtml, sendResendEmail } from "@/lib/email";
import { getFriendlyAuthError, logDevelopmentError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { applyRateLimitHeaders, getClientIp } from "@/lib/request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const passwordResetSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(320),
});

function shouldHideResetError(message: string) {
  return /not found|unable to validate email address|invalid login credentials/i.test(message);
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: `auth:reset:${getClientIp(request)}`,
    limit: 5,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Too many reset requests. Please wait a minute before trying again." },
        { status: 429 },
      ),
      rateLimit,
    );
  }

  try {
    const parsed = passwordResetSchema.safeParse(await request.json());

    if (!parsed.success) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." },
          { status: 400 },
        ),
        rateLimit,
      );
    }

    const { email } = parsed.data;
    const appUrl = getAppUrl();
    const redirectTo = `${appUrl}/api/auth/callback?next=${encodeURIComponent("/reset-password")}`;
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo,
      },
    });

    if (error) {
      if (shouldHideResetError(error.message)) {
        return applyRateLimitHeaders(
          NextResponse.json({
            message: "If that account exists, a HostBid reset link is on the way.",
          }),
          rateLimit,
        );
      }

      throw error;
    }

    const actionLink = data.properties?.action_link;

    if (!actionLink) {
      throw new Error("Supabase did not return a reset link.");
    }

    await sendResendEmail({
      to: email,
      subject: "Reset your HostBid password",
      html: buildAuthEmailHtml({
        heading: "Reset your HostBid password",
        intro: "Use this private link to choose a new password. For security, ignore this email if you did not request it.",
        ctaLabel: "Reset password",
        actionUrl: actionLink,
      }),
      text: `Reset your HostBid password: ${actionLink}`,
    });

    return applyRateLimitHeaders(
      NextResponse.json({
        message: "If that account exists, a HostBid reset link is on the way.",
      }),
      rateLimit,
    );
  } catch (error) {
    logDevelopmentError("auth:password-reset", error);

    return applyRateLimitHeaders(
      NextResponse.json(
        { error: getFriendlyAuthError(error instanceof Error ? error.message : undefined, "Unable to send a reset email.") },
        { status: 400 },
      ),
      rateLimit,
    );
  }
}
