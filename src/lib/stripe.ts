import "server-only";

import Stripe from "stripe";
import { getPlatformFeePercent, hasEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

let stripeInstance: Stripe | null = null;

type StripeConnectProfileUpdate = {
  stripe_onboarding_complete: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_requirements_currently_due: string[];
  stripe_requirements_disabled_reason: string | null;
};

export function hasStripeEnv() {
  return hasEnv("STRIPE_SECRET_KEY");
}

export function getStripe() {
  if (!hasStripeEnv()) {
    throw new Error("Stripe is not configured yet.");
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  return stripeInstance;
}

export function calculatePlatformFee(amountCents: number) {
  return Math.round((amountCents * getPlatformFeePercent()) / 100);
}

export async function refundDestinationChargePaymentIntent(paymentIntentId: string) {
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const chargeId =
    typeof paymentIntent.latest_charge === "string"
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge?.id;

  if (!chargeId) {
    throw new Error("No captured charge was found for this payment.");
  }

  return stripe.refunds.create({
    charge: chargeId,
    reverse_transfer: true,
    refund_application_fee: true,
  });
}

export function getStripeConnectProfileUpdate(account: Stripe.Account): StripeConnectProfileUpdate {
  return {
    stripe_onboarding_complete: account.details_submitted,
    stripe_charges_enabled: account.charges_enabled,
    stripe_payouts_enabled: account.payouts_enabled,
    stripe_requirements_currently_due: account.requirements?.currently_due ?? [],
    stripe_requirements_disabled_reason: account.requirements?.disabled_reason ?? null,
  };
}

export async function syncStripeConnectAccount(account: Stripe.Account) {
  const admin = createSupabaseAdminClient();
  const update = getStripeConnectProfileUpdate(account);

  await admin
    .from("profiles")
    .update(update)
    .eq("stripe_connect_account_id", account.id);

  return update;
}
