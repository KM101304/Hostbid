import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

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
      .select("*, experiences(*)")
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

    try {
      await stripe.paymentIntents.capture(bid.payment_intent_id);
    } catch {
      await admin.from("bids").update({ status: "capture_failed" }).eq("id", bid.id);
      return NextResponse.json({ error: "Payment capture failed. Please choose another bid." }, { status: 402 });
    }

    const { data: losingBids } = await admin
      .from("bids")
      .select("*")
      .eq("experience_id", bid.experience_id)
      .neq("id", bid.id)
      .eq("status", "active");

    for (const losingBid of losingBids ?? []) {
      await stripe.paymentIntents.cancel(losingBid.payment_intent_id);
      await admin.from("bids").update({ status: "refunded", refunded_at: new Date().toISOString() }).eq("id", losingBid.id);
    }

    await admin
      .from("bids")
      .update({ status: "selected", captured_at: new Date().toISOString() })
      .eq("id", bid.id);

    await admin
      .from("experiences")
      .update({
        selected_bid_id: bid.id,
        winner_user_id: bid.bidder_id,
        status: "closed",
        chat_unlocked_at: new Date().toISOString(),
      })
      .eq("id", bid.experience_id);

    await admin.from("threads").upsert({
      experience_id: bid.experience_id,
      poster_id: bid.experiences.user_id,
      bidder_id: bid.bidder_id,
      unlocked_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to accept bid." },
      { status: 400 },
    );
  }
}
