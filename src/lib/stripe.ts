import "server-only";

import Stripe from "stripe";
import { getPlatformFeePercent, hasEnv } from "@/lib/env";

let stripeInstance: Stripe | null = null;

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
