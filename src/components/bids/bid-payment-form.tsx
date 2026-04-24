"use client";

import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

function BidPaymentInner({
  experienceId,
  startingBidCents,
}: {
  experienceId: string;
  startingBidCents: number | null;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const minimumAmountCents = startingBidCents ?? 1000;
  const [amount, setAmount] = useState(String(Math.max(minimumAmountCents / 100, 10)));
  const [pitch, setPitch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const amountCents = useMemo(() => Math.round(Number(amount || "0") * 100), [amount]);

  useEffect(() => {
    if (!elements || amountCents < 1000) {
      return;
    }

    elements.update({ amount: amountCents });
  }, [amountCents, elements]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const submitResult = await elements.submit();

    if (submitResult.error) {
      setSubmitting(false);
      setMessage(submitResult.error.message ?? "Please complete your payment details.");
      return;
    }

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

    setMessage("Offer secured. The host can now review it.");
  }

  return (
    <Card as="form" onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-7">
      <div className="space-y-3">
        <Badge tone="primary">
          <Sparkles className="h-3.5 w-3.5" />
          Submit an offer
        </Badge>
        <div>
          <h2 className="text-[32px] font-bold tracking-[-0.04em] text-slate-900">Lead with clarity and fit.</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Share why you match the experience, then authorize your offer for review.
          </p>
        </div>
      </div>

      <Input
        aria-label="Offer amount in USD"
        type="number"
        min={String(minimumAmountCents / 100)}
        step="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Offer amount in USD"
      />
      {startingBidCents ? (
        <p className="text-sm leading-6 text-slate-500">
          The host quietly set a starting bid of {formatCurrency(startingBidCents)}. You can offer that amount or higher.
        </p>
      ) : null}
      <Textarea
        aria-label="Offer note"
        value={pitch}
        onChange={(e) => setPitch(e.target.value)}
        placeholder="What would make your hosting style feel thoughtful, comfortable, and memorable?"
      />

      <div className="surface-subtle space-y-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Authorization hold</p>
          <Badge tone="success">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure
          </Badge>
        </div>
        <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">{formatCurrency(amountCents)}</p>
        <p className="text-sm leading-6 text-slate-600">
          Funds are held now, captured only if you are accepted, and released if you are not selected.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <PaymentElement />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={submitting || !stripe || !elements || amountCents < minimumAmountCents}
      >
        {submitting ? "Securing offer..." : "Submit offer"}
      </Button>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </Card>
  );
}

function UnsecuredBidForm({
  experienceId,
  startingBidCents,
}: {
  experienceId: string;
  startingBidCents: number | null;
}) {
  const minimumAmountCents = startingBidCents ?? 1000;
  const [amount, setAmount] = useState(String(Math.max(minimumAmountCents / 100, 10)));
  const [pitch, setPitch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const amountCents = useMemo(() => Math.round(Number(amount || "0") * 100), [amount]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const response = await fetch(`/api/experiences/${experienceId}/bids`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCents,
        pitch,
        paymentMode: "unsecured",
      }),
    });
    const payload = await response.json();

    setSubmitting(false);
    setMessage(
      response.ok
        ? "Offer sent. This host still needs payout setup before payment can be secured."
        : payload.error ?? "Unable to send offer.",
    );
  }

  return (
    <Card as="form" onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-7">
      <div className="space-y-3">
        <Badge tone="primary">
          <Sparkles className="h-3.5 w-3.5" />
          Send an offer request
        </Badge>
        <div>
          <h2 className="text-[32px] font-bold tracking-[-0.04em] text-slate-900">Lead with clarity and fit.</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            This host can receive offers now, but payment authorization will happen after payout setup is ready.
          </p>
        </div>
      </div>

      <Input
        aria-label="Offer amount in USD"
        type="number"
        min={String(minimumAmountCents / 100)}
        step="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Offer amount in USD"
      />
      <Textarea
        aria-label="Offer note"
        value={pitch}
        onChange={(e) => setPitch(e.target.value)}
        placeholder="What makes you a thoughtful fit for this experience?"
      />

      <div className="surface-subtle space-y-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Payment status</p>
        <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">{formatCurrency(amountCents)}</p>
        <p className="text-sm leading-6 text-slate-600">
          No funds are held yet. The host will see your offer as an unsecured request.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={submitting || amountCents < minimumAmountCents}>
        {submitting ? "Sending offer..." : "Send offer request"}
      </Button>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </Card>
  );
}

export function BidPaymentForm({
  experienceId,
  startingBidCents,
  paymentsReady,
}: {
  experienceId: string;
  startingBidCents: number | null;
  paymentsReady: boolean;
}) {
  const canRenderPaymentElement = paymentsReady && Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  if (!canRenderPaymentElement) {
    return <UnsecuredBidForm experienceId={experienceId} startingBidCents={startingBidCents} />;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: "payment",
        amount: startingBidCents ?? 12000,
        currency: "usd",
        captureMethod: "manual",
      }}
    >
      <BidPaymentInner experienceId={experienceId} startingBidCents={startingBidCents} />
    </Elements>
  );
}
