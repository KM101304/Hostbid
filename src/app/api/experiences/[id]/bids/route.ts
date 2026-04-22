import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { calculatePlatformFee, getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { bidIntentSchema } from "@/lib/validators";

export async function GET(
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
      const { data } = await admin
        .from("bids")
        .select("*")
        .eq("experience_id", id)
        .eq("bidder_id", user.id)
        .order("created_at", { ascending: false });

      return NextResponse.json({ bids: data ?? [] });
    }

    const { data } = await admin
      .from("bids")
      .select(
        `
          *,
          profiles!bids_bidder_id_fkey (
            id,
            full_name,
            avatar_url,
            bio,
            location,
            quality_score,
            is_verified
          )
        `,
      )
      .eq("experience_id", id)
      .order("amount_cents", { ascending: false })
      .order("created_at", { ascending: false });

    return NextResponse.json({ bids: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch bids." },
      { status: 400 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const admin = createSupabaseAdminClient();
    const stripe = getStripe();
    const body = await request.json();
    const parsed = bidIntentSchema.parse(body);

    const { data: experience } = await admin
      .from("experiences")
      .select("*, profiles!experiences_user_id_fkey(id, full_name, stripe_connect_account_id)")
      .eq("id", id)
      .maybeSingle();

    if (!experience) {
      throw new Error("Experience not found.");
    }

    if (experience.user_id === user.id) {
      throw new Error("You cannot bid on your own experience.");
    }

    if (experience.status !== "open") {
      throw new Error("This experience is no longer accepting offers.");
    }

    if (experience.expires_at && new Date(experience.expires_at) < new Date()) {
      throw new Error("This experience is inactive.");
    }

    const { data: existingBid } = await admin
      .from("bids")
      .select("*")
      .eq("experience_id", id)
      .eq("bidder_id", user.id)
      .in("status", ["active", "selected"])
      .maybeSingle();

    if (existingBid) {
      throw new Error("You already have a live offer on this experience.");
    }

    const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();

    let customerId = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
        name: profile?.full_name ?? undefined,
      });
      customerId = customer.id;
      await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    if (!parsed.paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: parsed.amountCents,
        currency: "usd",
        capture_method: "manual",
        customer: customerId,
        automatic_payment_methods: { enabled: true },
        application_fee_amount: experience.profiles?.stripe_connect_account_id
          ? calculatePlatformFee(parsed.amountCents)
          : undefined,
        transfer_data: experience.profiles?.stripe_connect_account_id
          ? { destination: experience.profiles.stripe_connect_account_id }
          : undefined,
        metadata: {
          bidderId: user.id,
          experienceId: id,
          hostId: experience.user_id,
          pitch: parsed.pitch,
          amountCents: String(parsed.amountCents),
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(parsed.paymentIntentId);

    if (paymentIntent.status !== "requires_capture") {
      throw new Error("Payment authorization is not ready for capture.");
    }

    const { data, error } = await admin
      .from("bids")
      .insert({
        experience_id: id,
        bidder_id: user.id,
        amount_cents: parsed.amountCents,
        pitch: parsed.pitch,
        payment_intent_id: paymentIntent.id,
        status: "active",
      })
      .select("*")
      .single();

    if (error) {
      await stripe.paymentIntents.cancel(paymentIntent.id);
      throw error;
    }

    return NextResponse.json({ bid: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to place bid." },
      { status: 400 },
    );
  }
}
