"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, LocateFixed, ShieldCheck, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ShareState = {
  id: string;
  token: string;
  expiresAt: string;
  shareUrl: string;
};

export function LocationShareCard() {
  const watchIdRef = useRef<number | null>(null);
  const [share, setShare] = useState<ShareState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  async function updateLocation(shareId: string, position: GeolocationPosition) {
    await fetch(`/api/location-shares/${shareId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: position.coords.accuracy,
      }),
    });
  }

  async function requestCurrentLocation() {
    if ("permissions" in navigator && navigator.permissions?.query) {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" });

        if (permission.state === "denied") {
          throw new Error("Location access is blocked. Enable location permission for this site and try again.");
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("blocked")) {
          throw error;
        }
      }
    }

    return await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20_000,
      });
    });
  }

  async function startSharing() {
    setMessage(null);

    if (!("geolocation" in navigator)) {
      setMessage("This device does not support location sharing.");
      return;
    }

    setStarting(true);

    let firstPosition: GeolocationPosition;

    try {
      firstPosition = await requestCurrentLocation();
    } catch (error) {
      setStarting(false);
      setMessage(error instanceof Error ? error.message : "Location permission was denied.");
      return;
    }

    const response = await fetch("/api/location-shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMinutes: 120 }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setStarting(false);
      setMessage(payload.error ?? "Unable to start location sharing.");
      return;
    }

    const nextShare = payload.share as ShareState;
    setShare(nextShare);
    await updateLocation(nextShare.id, firstPosition);
    setSharing(true);
    setStarting(false);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        void updateLocation(nextShare.id, position);
      },
      (error) => {
        setMessage(error.message || "Location permission was denied.");
        setSharing(false);
        setStarting(false);
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
  }

  async function stopSharing() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (share) {
      await fetch(`/api/location-shares/${share.id}`, { method: "DELETE" });
    }

    setSharing(false);
    setStarting(false);
    setShare(null);
    setMessage("Location sharing stopped.");
  }

  async function copyLink() {
    if (!share) return;
    await navigator.clipboard.writeText(share.shareUrl);
    setMessage("Private tracking link copied.");
  }

  return (
    <Card as="section" className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold text-slate-900">Trusted location link</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Share your live location with one trusted person for two hours. Stop sharing any time.
          </p>
        </div>
        <Badge tone={sharing ? "success" : starting ? "info" : "default"}>
          {sharing ? "Live" : starting ? "Starting" : "Off"}
        </Badge>
      </div>

      {share ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 text-sm leading-6 text-slate-600">
          <p className="font-medium text-slate-900">Expires {new Date(share.expiresAt).toLocaleString()}</p>
          <p className="mt-2 break-all">{share.shareUrl}</p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {share ? (
          <>
            <Button type="button" variant="secondary" className="gap-2" onClick={copyLink}>
              <Copy className="h-4 w-4" />
              Copy trusted link
            </Button>
            <Button type="button" variant="danger" className="gap-2" onClick={stopSharing}>
              <Square className="h-4 w-4" />
              Stop sharing
            </Button>
          </>
        ) : (
          <Button type="button" className="gap-2 sm:col-span-2" onClick={startSharing} disabled={starting}>
            <LocateFixed className="h-4 w-4" />
            {starting ? "Requesting location..." : "Share my live location"}
          </Button>
        )}
      </div>

      {message ? (
        <div
          className="fixed right-4 top-[calc(5rem+env(safe-area-inset-top))] z-50 max-w-sm rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 shadow-soft-lg"
          role="status"
        >
          {message}
        </div>
      ) : null}
    </Card>
  );
}
