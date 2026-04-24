import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getRequiredEnv, hasEnv } from "@/lib/env";
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

    if (event.type === "payment_intent.canceled") {
      const paymentIntent = event.data.object;
      await admin
        .from("bids")
        .update({ status: "refunded", refunded_at: new Date().toISOString() })
        .eq("payment_intent_id", paymentIntent.id);
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      await admin.from("bids").update({ status: "capture_failed" }).eq("payment_intent_id", paymentIntent.id);
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
