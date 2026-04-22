import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getAppUrl } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { applyRateLimitHeaders, getClientIp } from "@/lib/request";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function getOrCreateConnectAccountId(userId: string, email: string | null | undefined) {
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_connect_account_id, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.stripe_connect_account_id) {
    return {
      accountId: profile.stripe_connect_account_id,
      profileName: profile.full_name ?? undefined,
    };
  }

  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    email: email ?? undefined,
    metadata: {
      userId,
    },
  });

  await admin
    .from("profiles")
    .update({ stripe_connect_account_id: account.id })
    .eq("id", userId);

  return {
    accountId: account.id,
    profileName: profile?.full_name ?? undefined,
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.stripe_connect_account_id) {
      return NextResponse.json({
        accountId: null,
        connected: false,
        onboardingComplete: false,
        payoutsEnabled: false,
      });
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);

    return NextResponse.json({
      accountId: profile.stripe_connect_account_id,
      connected: true,
      onboardingComplete: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch Stripe connection status." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const rateLimit = checkRateLimit({
      key: `stripe-connect:${user.id}:${getClientIp(request)}`,
      limit: 8,
      windowMs: 10 * 60_000,
    });

    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: "Too many Stripe setup attempts. Please wait a few minutes and try again." },
          { status: 429 },
        ),
        rateLimit,
      );
    }

    const stripe = getStripe();
    const appUrl = getAppUrl();
    const { accountId } = await getOrCreateConnectAccountId(user.id, user.email);
    const account = await stripe.accounts.retrieve(accountId);

    if (account.details_submitted && account.charges_enabled) {
      const loginLink = await stripe.accounts.createLoginLink(accountId);
      return applyRateLimitHeaders(
        NextResponse.json({ url: loginLink.url, mode: "dashboard", accountId }),
        rateLimit,
      );
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      return_url: `${appUrl}/profile?stripe=connected`,
      refresh_url: `${appUrl}/profile?stripe=refresh`,
    });

    return applyRateLimitHeaders(NextResponse.json({ url: accountLink.url, mode: "onboarding", accountId }), rateLimit);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start Stripe onboarding." },
      { status: 400 },
    );
  }
}
