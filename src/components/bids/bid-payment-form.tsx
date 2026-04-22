"use client";

import { useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

function BidPaymentInner({ experienceId }: { experienceId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState("120");
  const [pitch, setPitch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const amountCents = useMemo(() => Math.round(Number(amount || "0") * 100), [amount]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const intentResponse = await fetch(`/api/experiences/${experienceId}/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amountCents,
        pitch,
      }),
    });

    const intentPayload = await intentResponse.json();

    if (!intentResponse.ok) {
      setSubmitting(false);
      setMessage(intentPayload.error ?? "Unable to start authorization.");
      return;
    }

    const result = await stripe.confirmPayment({
      elements,
      clientSecret: intentPayload.clientSecret,
      redirect: "if_required",
    });

    if (result.error) {
      setSubmitting(false);
      setMessage(result.error.message ?? "Payment confirmation failed.");
      return;
    }

    const finalizeResponse = await fetch(`/api/experiences/${experienceId}/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amountCents,
        pitch,
        paymentIntentId: intentPayload.paymentIntentId,
      }),
    });

    const finalizePayload = await finalizeResponse.json();
    setSubmitting(false);

    if (!finalizeResponse.ok) {
      setMessage(finalizePayload.error ?? "Bid authorization could not be finalized.");
      return;
    }

    setMessage("Offer secured. The poster can now review it.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-stone-200 bg-white p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-stone-500">Submit an offer</p>
        <h2 className="mt-2 font-serif text-3xl text-stone-950">Lead with taste, not just spend.</h2>
      </div>
      <Input type="number" min="10" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Textarea value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="Why your hosting style fits this experience." />
      <div className="rounded-[1.5rem] bg-stone-100 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Authorization hold</p>
        <p className="mt-2 text-lg font-semibold text-stone-950">{formatCurrency(amountCents)}</p>
        <p className="mt-2 text-sm text-stone-600">
          Funds are held now, captured only if you are selected, and released if you are not.
        </p>
      </div>
      <PaymentElement />
      <Button type="submit" className="w-full" disabled={submitting || !stripe || !elements}>
        {submitting ? "Securing offer..." : "Authorize and submit bid"}
      </Button>
      {message ? <p className="text-sm text-stone-600">{message}</p> : null}
    </form>
  );
}

export function BidPaymentForm({
  experienceId,
}: {
  experienceId: string;
}) {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="rounded-[2rem] border border-dashed border-amber-300 bg-amber-50 p-5 text-sm text-amber-800">
        Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to enable bid authorization.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ mode: "payment", amount: 1000, currency: "usd" }}>
      <BidPaymentInner experienceId={experienceId} />
    </Elements>
  );
}
