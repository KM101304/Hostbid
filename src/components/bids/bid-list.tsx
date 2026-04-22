"use client";

import { useRouter } from "next/navigation";
import { MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type Bid = {
  id: string;
  amount_cents: number;
  pitch: string;
  status: string;
  created_at: string;
  bidder_id: string;
  profiles?: {
    full_name?: string | null;
    bio?: string | null;
    location?: string | null;
    quality_score?: number | null;
    is_verified?: boolean | null;
    avatar_url?: string | null;
  } | null;
};

function offerLabel(amountCents: number) {
  if (amountCents >= 30000) return "Top Offer";
  if (amountCents >= 15000) return "High Interest";
  return "Standard";
}

export function BidList({
  bids,
  isOwner,
}: {
  bids: Bid[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const actionableBids = bids.filter((bid) => bid.status === "active");

  async function acceptBid(bidId: string) {
    const response = await fetch(`/api/bids/${bidId}/accept`, { method: "POST" });
    const payload = await response.json();
    if (!response.ok) {
      alert(payload.error ?? "Unable to accept bid.");
      return;
    }
    router.refresh();
  }

  async function refundBid(bidId: string) {
    const response = await fetch(`/api/bids/${bidId}/refund`, { method: "POST" });
    const payload = await response.json();
    if (!response.ok) {
      alert(payload.error ?? "Unable to release funds.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {bids.length === 0 ? (
        <Card className="border-dashed p-6 text-sm text-slate-500">
          No offers yet. This experience is still waiting for the right person to step forward.
        </Card>
      ) : null}

      {bids.map((bid) => (
        <Card key={bid.id} as="article" hover className="space-y-5 p-5">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="flex gap-4">
              <Avatar
                src={bid.profiles?.avatar_url}
                alt={bid.profiles?.full_name ?? "Bidder"}
                className="h-14 w-14"
                fallback={bid.profiles?.full_name?.slice(0, 1)}
              />
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    {offerLabel(bid.amount_cents)}
                  </Badge>
                  <Badge tone="info">
                    <Star className="h-3.5 w-3.5" />
                    Status {bid.status}
                  </Badge>
                  {bid.profiles?.is_verified ? (
                    <Badge tone="success">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified
                    </Badge>
                  ) : null}
                </div>

                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-900">
                    {bid.profiles?.full_name ?? "Bidder"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Profile quality {bid.profiles?.quality_score ?? 0} · {formatDateTime(bid.created_at)}
                  </p>
                </div>

                <p className="text-sm leading-7 text-slate-600">{bid.pitch}</p>

                <div className="flex flex-wrap gap-2">
                  <Badge>
                    <MapPin className="h-3.5 w-3.5" />
                    {bid.profiles?.location ?? "Location private"}
                  </Badge>
                  <Badge tone="warning">Offer secured</Badge>
                </div>
              </div>
            </div>

            <div className="surface-subtle min-w-[176px] px-4 py-4 text-left lg:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Offer amount</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">
                {formatCurrency(bid.amount_cents)}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Visible as context, not the whole story.
              </p>
            </div>
          </div>

          {isOwner && bid.status === "active" ? (
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => acceptBid(bid.id)}>Accept offer</Button>
              <Button variant="secondary" onClick={() => refundBid(bid.id)}>
                Release offer
              </Button>
            </div>
          ) : null}
        </Card>
      ))}

      {isOwner && actionableBids.length > 1 ? (
        <p className="text-xs leading-6 text-slate-500">
          Multiple active offers are normal. Acceptance should still reflect fit, safety, and overall quality.
        </p>
      ) : null}
    </div>
  );
}
