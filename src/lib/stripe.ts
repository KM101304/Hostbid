import "server-only";

import Stripe from "stripe";
import { getRequiredEnv, getPlatformFeePercent } from "@/lib/env";

export const stripe = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));

export function calculatePlatformFee(amountCents: number) {
  return Math.round((amountCents * getPlatformFeePercent()) / 100);
}
