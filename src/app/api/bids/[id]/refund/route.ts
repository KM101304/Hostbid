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

    if (bid.experiences.user_id !== user.id && bid.bidder_id !== user.id) {
      throw new Error("You cannot release this offer.");
    }

    if (bid.status === "selected") {
      await stripe.refunds.create({ payment_intent: bid.payment_intent_id });
    } else {
      await stripe.paymentIntents.cancel(bid.payment_intent_id);
    }

    await admin
      .from("bids")
      .update({ status: "refunded", refunded_at: new Date().toISOString() })
      .eq("id", bid.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to refund bid." },
      { status: 400 },
    );
  }
}
