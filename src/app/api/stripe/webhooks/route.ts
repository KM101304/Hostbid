import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getRequiredEnv, hasEnv } from "@/lib/env";
import { syncStripeIdentitySession } from "@/lib/identity";
import {
  markPaymentAuthorizationReady,
  reopenExperienceAfterCaptureFailure,
  unlockConfirmedMatch,
} from "@/lib/payments";
import { getStripe, syncStripeConnectAccount } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getWebhookSecrets() {
  const secrets = [getRequiredEnv("STRIPE_WEBHOOK_SECRET")];

  if (hasEnv("STRIPE_CONNECT_WEBHOOK_SECRET")) {
    secrets.push(process.env.STRIPE_CONNECT_WEBHOOK_SECRET!);
  }

  return secrets;
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const event = getWebhookSecrets().reduce<ReturnType<typeof stripe.webhooks.constructEvent> | null>(
      (verifiedEvent, secret) => {
        if (verifiedEvent) {
          return verifiedEvent;
        }

        try {
          return stripe.webhooks.constructEvent(payload, signature, secret);
        } catch {
          return null;
        }
      },
      null,
    );

    if (!event) {
      throw new Error("No matching webhook secret found.");
    }

    const admin = createSupabaseAdminClient();

    if (event.type === "account.updated") {
      const account = event.data.object;
      await syncStripeConnectAccount(account);
    }

    if (
      event.type === "identity.verification_session.verified" ||
      event.type === "identity.verification_session.requires_input" ||
      event.type === "identity.verification_session.canceled" ||
      event.type === "identity.verification_session.processing"
    ) {
      const session = event.data.object;
      await syncStripeIdentitySession(session);
    }

    if (event.type === "payment_intent.canceled") {
      const paymentIntent = event.data.object;
      const { data: bid } = await admin
        .from("bids")
        .select("id, status")
        .eq("payment_intent_id", paymentIntent.id)
        .maybeSingle();

      if (bid) {
        await reopenExperienceAfterCaptureFailure(bid.id);
      }

      await admin
        .from("bids")
        .update({ status: "refunded", refunded_at: new Date().toISOString() })
        .eq("payment_intent_id", paymentIntent.id);
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      const { data: bid } = await admin
        .from("bids")
        .select("id")
        .eq("payment_intent_id", paymentIntent.id)
        .maybeSingle();

      if (bid) {
        await reopenExperienceAfterCaptureFailure(bid.id);
      }
    }

    if (event.type === "payment_intent.amount_capturable_updated") {
      const paymentIntent = event.data.object;
      await markPaymentAuthorizationReady(paymentIntent.id);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const { data: bid } = await admin
        .from("bids")
        .select("id, status")
        .eq("payment_intent_id", paymentIntent.id)
        .maybeSingle();

      const { data: selectedExperience } = bid
        ? await admin
            .from("experiences")
            .select("id")
            .eq("selected_bid_id", bid.id)
            .maybeSingle()
        : { data: null };

      if (bid && (bid.status === "selected" || selectedExperience)) {
        await unlockConfirmedMatch(bid.id, new Date().toISOString());
      }
    }

    if (event.type === "payout.failed" && event.account) {
      const account = await stripe.accounts.retrieve(event.account);
      await syncStripeConnectAccount(account);
    }

    if (event.type === "charge.updated") {
      const charge = event.data.object;
      const paymentIntentId =
        typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;

      if (paymentIntentId && charge.transfer_data === null) {
        await admin
          .from("bids")
          .update({ status: "capture_failed" })
          .eq("payment_intent_id", paymentIntentId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook error." },
      { status: 400 },
    );
  }
}
