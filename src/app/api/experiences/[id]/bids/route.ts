import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/auth";
import { LIVE_BID_STATUSES } from "@/lib/payments";
import { checkRateLimit } from "@/lib/rate-limit";
import { applyRateLimitHeaders, getClientIp } from "@/lib/request";
import { calculatePlatformFee, getStripe, hasStripeEnv } from "@/lib/stripe";
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
        .order("created_at", { ascending: false })
        .limit(20);

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
      .order("created_at", { ascending: false })
      .limit(50);

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
    const rateLimit = checkRateLimit({
      key: `bid:create:${user.id}:${getClientIp(request)}`,
      limit: 8,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: "Too many bid attempts. Please wait a minute and try again." },
          { status: 429 },
        ),
        rateLimit,
      );
    }

    const admin = createSupabaseAdminClient();
    const body = await request.json();
    const parsed = bidIntentSchema.parse(body);

    const { data: experience } = await admin
      .from("experiences")
      .select(
        "*, profiles!experiences_user_id_fkey(id, full_name, stripe_connect_account_id, stripe_charges_enabled, stripe_payouts_enabled)",
      )
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

    if (experience.budget_min_cents && parsed.amountCents < experience.budget_min_cents) {
      throw new Error("This offer is below the host's starting bid.");
    }

    const hostCanSecurePayments = Boolean(
      hasStripeEnv() &&
        experience.profiles?.stripe_connect_account_id &&
        experience.profiles.stripe_charges_enabled &&
        experience.profiles.stripe_payouts_enabled,
    );

    const { data: existingBid } = await admin
      .from("bids")
      .select("*")
      .eq("experience_id", id)
      .eq("bidder_id", user.id)
      .in("status", [...LIVE_BID_STATUSES])
      .maybeSingle();

    if (existingBid && (!parsed.paymentIntentId || existingBid.payment_intent_id !== parsed.paymentIntentId)) {
      throw new Error("You already have a live offer on this experience.");
    }

    if (parsed.paymentMode === "unsecured" || !hostCanSecurePayments) {
      const { data, error } = await admin
        .from("bids")
        .insert({
          experience_id: id,
          bidder_id: user.id,
          amount_cents: parsed.amountCents,
          pitch: parsed.pitch,
          payment_intent_id: `unsecured_${randomUUID()}`,
          status: "active",
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return applyRateLimitHeaders(
        NextResponse.json({
          bid: data,
          paymentMode: "unsecured",
          warning: "Offer sent without a payment authorization because host payouts are not ready yet.",
        }),
        rateLimit,
      );
    }

    const stripe = getStripe();
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
        on_behalf_of: experience.profiles!.stripe_connect_account_id!,
        application_fee_amount: calculatePlatformFee(parsed.amountCents),
        transfer_data: { destination: experience.profiles!.stripe_connect_account_id! },
        metadata: {
          bidderId: user.id,
          experienceId: id,
          hostId: experience.user_id,
          pitch: parsed.pitch,
          amountCents: String(parsed.amountCents),
        },
      });
      const { data: bid, error } = await admin
        .from("bids")
        .insert({
          experience_id: id,
          bidder_id: user.id,
          amount_cents: parsed.amountCents,
          pitch: parsed.pitch,
          payment_intent_id: paymentIntent.id,
          status: "capture_failed",
        })
        .select("*")
        .single();

      if (error) {
        await stripe.paymentIntents.cancel(paymentIntent.id);
        throw error;
      }

      return applyRateLimitHeaders(
        NextResponse.json({
          bid,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        }),
        rateLimit,
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(parsed.paymentIntentId);
    const expectedFee = calculatePlatformFee(parsed.amountCents);
    const paymentIntentCustomerId =
      typeof paymentIntent.customer === "string" ? paymentIntent.customer : paymentIntent.customer?.id;
    const paymentIntentDestination =
      typeof paymentIntent.transfer_data?.destination === "string"
        ? paymentIntent.transfer_data.destination
        : paymentIntent.transfer_data?.destination?.id;
    const paymentIntentOnBehalfOf =
      typeof paymentIntent.on_behalf_of === "string" ? paymentIntent.on_behalf_of : paymentIntent.on_behalf_of?.id;

    if (paymentIntent.status !== "requires_capture") {
      throw new Error("Payment authorization is not ready for capture.");
    }

    if (paymentIntent.capture_method !== "manual") {
      throw new Error("Payment authorization is not configured for manual capture.");
    }

    if (paymentIntent.amount !== parsed.amountCents) {
      throw new Error("Payment authorization amount does not match this offer.");
    }

    if (paymentIntent.currency !== "usd") {
      throw new Error("Payment authorization currency does not match this offer.");
    }

    if (paymentIntentCustomerId !== customerId) {
      throw new Error("Payment authorization does not belong to this bidder.");
    }

    if (paymentIntentDestination !== experience.profiles!.stripe_connect_account_id) {
      throw new Error("Payment authorization payout destination is invalid.");
    }

    if (paymentIntentOnBehalfOf !== experience.profiles!.stripe_connect_account_id) {
      throw new Error("Payment authorization settlement merchant is invalid.");
    }

    if (paymentIntent.application_fee_amount !== expectedFee) {
      throw new Error("Payment authorization fee does not match this offer.");
    }

    if (
      paymentIntent.metadata.bidderId !== user.id ||
      paymentIntent.metadata.experienceId !== id ||
      paymentIntent.metadata.hostId !== experience.user_id
    ) {
      throw new Error("Payment authorization metadata does not match this offer.");
    }

    const bidPayload = {
      experience_id: id,
      bidder_id: user.id,
      amount_cents: parsed.amountCents,
      pitch: parsed.pitch,
      payment_intent_id: paymentIntent.id,
      status: "active",
    };
    const { data: authorizationBid } = await admin
      .from("bids")
      .select("*")
      .eq("experience_id", id)
      .eq("bidder_id", user.id)
      .eq("payment_intent_id", paymentIntent.id)
      .maybeSingle();

    const { data, error } = existingBid
      ? await admin.from("bids").update(bidPayload).eq("id", existingBid.id).select("*").single()
      : authorizationBid
        ? await admin.from("bids").update(bidPayload).eq("id", authorizationBid.id).select("*").single()
      : await admin.from("bids").insert(bidPayload).select("*").single();

    if (error) {
      await stripe.paymentIntents.cancel(paymentIntent.id);
      throw error;
    }

    return applyRateLimitHeaders(NextResponse.json({ bid: data }), rateLimit);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to place bid." },
      { status: 400 },
    );
  }
}
