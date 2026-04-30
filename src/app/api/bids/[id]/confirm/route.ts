import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { reopenExperienceAfterCaptureFailure, unlockConfirmedMatch } from "@/lib/payments";
import { getStripe, isStripePaymentIntentId } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const admin = createSupabaseAdminClient();
    const { data: bid } = await admin
      .from("bids")
      .select("*, experiences!bids_experience_id_fkey(*)")
      .eq("id", id)
      .maybeSingle();

    if (!bid) {
      throw new Error("Bid not found.");
    }

    if (bid.bidder_id !== user.id) {
      throw new Error("Only the accepted bidder can confirm this match.");
    }

    if (bid.status === "selected") {
      return NextResponse.json({ success: true, alreadyConfirmed: true });
    }

    if (bid.status !== "active") {
      throw new Error("This offer is not waiting for bidder confirmation.");
    }

    if (bid.experiences.selected_bid_id !== bid.id || bid.experiences.winner_user_id !== user.id) {
      throw new Error("This offer is no longer selected by the host.");
    }

    let capturedAt: string | null = null;

    if (isStripePaymentIntentId(bid.payment_intent_id)) {
      const stripe = getStripe();

      try {
        const currentPaymentIntent = await stripe.paymentIntents.retrieve(bid.payment_intent_id);

        if (currentPaymentIntent.status === "succeeded") {
          capturedAt = new Date().toISOString();
        } else {
          if (currentPaymentIntent.status !== "requires_capture") {
            throw new Error("Payment authorization is not ready for capture.");
          }

          const paymentIntent = await stripe.paymentIntents.capture(bid.payment_intent_id);
          capturedAt = paymentIntent.status === "succeeded" ? new Date().toISOString() : null;
        }
      } catch {
        await reopenExperienceAfterCaptureFailure(bid.id);
        return NextResponse.json(
          { error: "Payment capture failed. The experience has been reopened so the host can choose another offer." },
          { status: 402 },
        );
      }
    }

    await unlockConfirmedMatch(bid.id, capturedAt);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to confirm payment." },
      { status: 400 },
    );
  }
}
