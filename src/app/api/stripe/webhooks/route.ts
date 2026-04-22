import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getRequiredEnv } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      getRequiredEnv("STRIPE_WEBHOOK_SECRET"),
    );
    const admin = createSupabaseAdminClient();

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

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook error." },
      { status: 400 },
    );
  }
}
