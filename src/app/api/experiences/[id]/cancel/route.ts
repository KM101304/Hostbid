import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { canCancelAwardedExperience } from "@/lib/marketplace";
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
    const { data: experience } = await admin.from("experiences").select("*").eq("id", id).maybeSingle();

    if (!experience) {
      throw new Error("Experience not found.");
    }

    if (user.id !== experience.user_id && user.id !== experience.winner_user_id) {
      throw new Error("Only matched participants can cancel this experience.");
    }

    if (!experience.selected_bid_id || !canCancelAwardedExperience(experience)) {
      throw new Error("Cancellation window has expired.");
    }

    const { data: selectedBid } = await admin.from("bids").select("*").eq("id", experience.selected_bid_id).maybeSingle();

    if (selectedBid?.payment_intent_id) {
      await stripe.refunds.create({ payment_intent: selectedBid.payment_intent_id });
      await admin
        .from("bids")
        .update({ status: "refunded", refunded_at: new Date().toISOString() })
        .eq("id", selectedBid.id);
    }

    await admin
      .from("experiences")
      .update({
        status: "cancelled",
      })
      .eq("id", experience.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to cancel experience." },
      { status: 400 },
    );
  }
}
