import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getStripe, isStripePaymentIntentId } from "@/lib/stripe";
import { releaseCompetingOffers } from "@/lib/payments";
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

    if (bid.experiences.user_id !== user.id) {
      throw new Error("Only the poster can accept an offer.");
    }

    if (bid.status !== "active") {
      throw new Error("This bid is not actionable.");
    }

    if (bid.experiences.status !== "open") {
      throw new Error("This experience is no longer accepting an offer.");
    }

    if (isStripePaymentIntentId(bid.payment_intent_id)) {
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.retrieve(bid.payment_intent_id);

      if (paymentIntent.status !== "requires_capture") {
        await admin.from("bids").update({ status: "capture_failed" }).eq("id", bid.id);
        return NextResponse.json(
          { error: "Payment authorization is not ready. Please choose another bid." },
          { status: 402 },
        );
      }
    }

    await releaseCompetingOffers(bid.experience_id, bid.id);

    await admin
      .from("experiences")
      .update({
        selected_bid_id: bid.id,
        winner_user_id: bid.bidder_id,
        status: "closed",
        chat_unlocked_at: null,
      })
      .eq("id", bid.experience_id);

    return NextResponse.json({ success: true, awaitingBidderConfirmation: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to accept bid." },
      { status: 400 },
    );
  }
}
