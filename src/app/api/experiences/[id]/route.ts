import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getStripe, hasStripeEnv, isStripePaymentIntentId } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const admin = createSupabaseAdminClient();
    const { data: experience } = await admin.from("experiences").select("*").eq("id", id).maybeSingle();

    if (!experience) {
      throw new Error("Experience not found.");
    }

    if (experience.user_id !== user.id) {
      throw new Error("Only the owner can remove this experience.");
    }

    if (experience.selected_bid_id || experience.winner_user_id) {
      throw new Error("Awarded experiences need to be cancelled from the match flow before they can be removed.");
    }

    const { data: activeBids } = await admin
      .from("bids")
      .select("id, payment_intent_id")
      .eq("experience_id", id)
      .eq("status", "active");
    const paymentIntentIds = (activeBids ?? [])
      .map((bid) => bid.payment_intent_id)
      .filter((paymentIntentId): paymentIntentId is string => isStripePaymentIntentId(paymentIntentId));

    if (paymentIntentIds.length > 0 && !hasStripeEnv()) {
      throw new Error("Stripe is required to release active payment holds before removing this experience.");
    }

    if (paymentIntentIds.length > 0) {
      const stripe = getStripe();

      for (const paymentIntentId of paymentIntentIds) {
        await stripe.paymentIntents.cancel(paymentIntentId);
      }
    }

    const { error } = await admin.from("experiences").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to remove experience." },
      { status: 400 },
    );
  }
}
