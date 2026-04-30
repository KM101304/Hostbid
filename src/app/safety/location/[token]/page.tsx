import { notFound } from "next/navigation";
import { MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { getLocationShare, isLocationShareVisible } from "@/lib/location-shares";

export default async function SharedLocationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!hasSupabaseAdminEnv()) {
    notFound();
  }

  const share = await getLocationShare(token);

  if (!share || !isLocationShareVisible(share)) {
    notFound();
  }

  const mapUrl =
    share.lastLatitude && share.lastLongitude
      ? `https://www.google.com/maps?q=${share.lastLatitude},${share.lastLongitude}`
      : null;

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-3xl items-center px-5 py-8">
      <Card as="section" className="w-full space-y-6 p-6 sm:p-8">
        <Badge tone="success">
          <ShieldCheck className="h-3.5 w-3.5" />
          Trusted location share
        </Badge>
        <div>
          <h1 className="page-title">{share.userName ?? "Your contact"} is sharing live location.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            This private link expires {new Date(share.expiresAt).toLocaleString()}. Refresh the page for the latest update.
          </p>
        </div>

        {mapUrl ? (
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="block rounded-[28px] border border-slate-200 bg-slate-50 p-5 transition hover:border-pink-200 hover:bg-white"
          >
            <div className="flex items-center gap-2 text-slate-900">
              <MapPin className="h-5 w-5 text-primary" />
              <p className="font-semibold">Open latest location</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Accuracy: about {Math.round(share.lastAccuracyMeters ?? 0)} meters. Last update:{" "}
              {share.lastSeenAt ? new Date(share.lastSeenAt).toLocaleString() : "waiting for phone location"}.
            </p>
          </a>
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            Waiting for the phone to send its first location update.
          </div>
        )}
      </Card>
    </main>
  );
}
