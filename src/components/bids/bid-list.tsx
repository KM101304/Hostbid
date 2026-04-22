"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
        <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-500">
          No offers yet.
        </div>
      ) : null}

      {bids.map((bid) => (
        <article key={bid.id} className="rounded-[2rem] border border-stone-200 bg-white p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="flex gap-4">
              <Avatar
                src={bid.profiles?.avatar_url}
                alt={bid.profiles?.full_name ?? "Bidder"}
                className="h-14 w-14"
                fallback={bid.profiles?.full_name?.slice(0, 1)}
              />
              <div>
              <p className="text-sm uppercase tracking-[0.22em] text-stone-500">{bid.status}</p>
              <h3 className="mt-2 text-lg font-semibold text-stone-950">
                {bid.profiles?.full_name ?? "Bidder"} · Selection score {bid.profiles?.quality_score ?? 0}
              </h3>
              <p className="mt-2 text-sm text-stone-600">{bid.pitch}</p>
              <p className="mt-3 text-xs text-stone-500">
                {bid.profiles?.location ?? "Location private"} · {formatDateTime(bid.created_at)}
              </p>
              </div>
            </div>
            <div className="rounded-[1.5rem] bg-stone-100 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Offer secured</p>
              <p className="mt-1 text-xl font-semibold text-stone-950">{formatCurrency(bid.amount_cents)}</p>
            </div>
          </div>

          {isOwner && bid.status === "active" ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => acceptBid(bid.id)}>Select this host</Button>
              <Button variant="secondary" onClick={() => refundBid(bid.id)}>
                Release offer
              </Button>
            </div>
          ) : null}
        </article>
      ))}

      {isOwner && actionableBids.length > 1 ? (
        <p className="text-xs text-stone-500">
          Tied amounts are handled naturally. You still choose the host based on fit, not bid order.
        </p>
      ) : null}
    </div>
  );
}
