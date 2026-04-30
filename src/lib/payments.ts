import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe, hasStripeEnv, isStripePaymentIntentId } from "@/lib/stripe";

export const LIVE_BID_STATUSES = ["active", "selected"] as const;

export async function releaseCompetingOffers(experienceId: string, selectedBidId: string) {
  const admin = createSupabaseAdminClient();
  const { data: losingBids } = await admin
    .from("bids")
    .select("id, payment_intent_id")
    .eq("experience_id", experienceId)
    .neq("id", selectedBidId)
    .eq("status", "active");

  const stripe = hasStripeEnv() ? getStripe() : null;
  const now = new Date().toISOString();

  for (const losingBid of losingBids ?? []) {
    if (stripe && isStripePaymentIntentId(losingBid.payment_intent_id)) {
      await stripe.paymentIntents.cancel(losingBid.payment_intent_id);
    }

    await admin
      .from("bids")
      .update({ status: "refunded", refunded_at: now })
      .eq("id", losingBid.id);
  }
}

export async function unlockConfirmedMatch(bidId: string, capturedAt?: string | null) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: bid } = await admin
    .from("bids")
    .select("*, experiences!bids_experience_id_fkey(*)")
    .eq("id", bidId)
    .maybeSingle();

  if (!bid) {
    throw new Error("Bid not found.");
  }

  await admin
    .from("bids")
    .update({
      status: "selected",
      captured_at: capturedAt ?? bid.captured_at ?? (isStripePaymentIntentId(bid.payment_intent_id) ? now : null),
    })
    .eq("id", bid.id);

  await admin
    .from("experiences")
    .update({
      selected_bid_id: bid.id,
      winner_user_id: bid.bidder_id,
      status: "closed",
      chat_unlocked_at: bid.experiences.chat_unlocked_at ?? now,
    })
    .eq("id", bid.experience_id);

  await admin.from("threads").upsert({
    experience_id: bid.experience_id,
    poster_id: bid.experiences.user_id,
    bidder_id: bid.bidder_id,
    unlocked_at: bid.experiences.chat_unlocked_at ?? now,
  });
}

export async function reopenExperienceAfterCaptureFailure(bidId: string) {
  const admin = createSupabaseAdminClient();
  const { data: bid } = await admin
    .from("bids")
    .select("experience_id")
    .eq("id", bidId)
    .maybeSingle();

  if (!bid) {
    return;
  }

  await admin.from("bids").update({ status: "capture_failed" }).eq("id", bidId);
  await admin
    .from("experiences")
    .update({
      selected_bid_id: null,
      winner_user_id: null,
      status: "open",
      chat_unlocked_at: null,
    })
    .eq("id", bid.experience_id)
    .eq("selected_bid_id", bidId);
}

export async function markPaymentAuthorizationReady(paymentIntentId: string) {
  const admin = createSupabaseAdminClient();
  await admin
    .from("bids")
    .update({ status: "active" })
    .eq("payment_intent_id", paymentIntentId)
    .eq("status", "capture_failed");
}
