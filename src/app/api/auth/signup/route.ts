import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppUrl } from "@/lib/env";
import { buildAuthEmailHtml, sendResendEmail } from "@/lib/email";
import { getFriendlyAuthError, logDevelopmentError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { applyRateLimitHeaders, getClientIp } from "@/lib/request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(320),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
  fullName: z.string().trim().min(2, "Enter your full name.").max(80),
});

function getValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the highlighted fields and try again.";
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: `auth:signup:${getClientIp(request)}`,
    limit: 5,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Too many sign-up attempts. Please wait a minute before trying again." },
        { status: 429 },
      ),
      rateLimit,
    );
  }

  try {
    const parsed = signupSchema.safeParse(await request.json());

    if (!parsed.success) {
      return applyRateLimitHeaders(
        NextResponse.json({ error: getValidationMessage(parsed.error) }, { status: 400 }),
        rateLimit,
      );
    }

    const { email, password, fullName } = parsed.data;
    const appUrl = getAppUrl();
    const redirectTo = `${appUrl}/api/auth/callback?next=${encodeURIComponent("/profile")}`;
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        redirectTo,
      },
    });

    if (error) {
      throw error;
    }

    const actionLink = data.properties?.action_link;

    if (!actionLink) {
      throw new Error("Supabase did not return a confirmation link.");
    }

    await sendResendEmail({
      to: email,
      subject: "Confirm your HostBid account",
      html: buildAuthEmailHtml({
        heading: "Confirm your HostBid account",
        intro: "You are one click away from building a profile with the trust signals hosts and bidders need.",
        ctaLabel: "Confirm account",
        actionUrl: actionLink,
      }),
      text: `Confirm your HostBid account: ${actionLink}`,
    });

    return applyRateLimitHeaders(
      NextResponse.json({
        message: "Check your email for a HostBid confirmation link.",
      }),
      rateLimit,
    );
  } catch (error) {
    logDevelopmentError("auth:signup", error);

    return applyRateLimitHeaders(
      NextResponse.json(
        { error: getFriendlyAuthError(error instanceof Error ? error.message : undefined, "Unable to create your account.") },
        { status: 400 },
      ),
      rateLimit,
    );
  }
}
