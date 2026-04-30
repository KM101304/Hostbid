"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { DateWindowField } from "@/components/experiences/date-window-field";
import { GooglePlacesField } from "@/components/location/google-places-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";

const SAFETY_OPTIONS = [
  "Public venue only",
  "No alcohol",
  "Daytime only",
  "Venue booked in advance",
];

export function ExperienceForm() {
  const router = useRouter();
  const [selectedSafety, setSelectedSafety] = useState<string[]>(["Public venue only"]);
  const [dateWindowStart, setDateWindowStart] = useState("");
  const [dateWindowEnd, setDateWindowEnd] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [location, setLocation] = useState("");
  const [locationPlaceId, setLocationPlaceId] = useState("");
  const [locationLatitude, setLocationLatitude] = useState<number | null>(null);
  const [locationLongitude, setLocationLongitude] = useState<number | null>(null);
  const [locationCity, setLocationCity] = useState<string | null>(null);
  const [locationProvince, setLocationProvince] = useState<string | null>(null);
  const [locationCountry, setLocationCountry] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [calendarMessage, setCalendarMessage] = useState<string | null>(null);
  const [startingBid, setStartingBid] = useState("");

  useUnsavedChangesWarning(hasUnsavedChanges && !submitting);

  const timingSummary = useMemo(() => {
    if (!dateWindowStart && !dateWindowEnd) {
      return "Timing is still flexible.";
    }

    if (dateWindowStart && dateWindowEnd) {
      return "Guests will see a clear start and end window for this experience.";
    }

    return "Guests will see a single anchor time, with flexibility around the rest.";
  }, [dateWindowEnd, dateWindowStart]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCalendarMessage(null);
    setSubmitting(true);
    setMessage(null);
    const formData = new FormData(event.currentTarget);

    if (dateWindowStart && dateWindowEnd && new Date(dateWindowEnd) <= new Date(dateWindowStart)) {
      setSubmitting(false);
      setCalendarMessage("End time needs to come after the start time.");
      return;
    }

    if (expiresAt && dateWindowStart && new Date(expiresAt) >= new Date(dateWindowStart)) {
      setSubmitting(false);
      setCalendarMessage("Offer deadline should happen before the experience starts.");
      return;
    }

    if (expiresAt && new Date(expiresAt) <= new Date()) {
      setSubmitting(false);
      setCalendarMessage("Offer deadline needs to be in the future.");
      return;
    }

    const response = await fetch("/api/experiences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description"),
        location,
        locationPlaceId,
        locationLatitude,
        locationLongitude,
        locationCity,
        locationProvince,
        locationCountry,
        vibeSummary: formData.get("vibeSummary"),
        dateWindowStart,
        dateWindowEnd,
        startingBidCents: startingBid ? Math.round(Number(startingBid) * 100) : undefined,
        expiresAt,
        safetyPreferences: selectedSafety,
      }),
    });

    const payload = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to create experience.");
      return;
    }

    setHasUnsavedChanges(false);
    router.push(`/experiences/${payload.experience.id}`);
    router.refresh();
  }

  function toggleSafety(option: string) {
    setHasUnsavedChanges(true);
    setSelectedSafety((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={() => setHasUnsavedChanges(true)}
      className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"
    >
      <Card as="section" className="space-y-5 p-6 sm:p-8">
        <div className="space-y-3">
          <Badge tone="primary">
            <Sparkles className="h-3.5 w-3.5" />
            New experience
          </Badge>
          <div>
            <h1 className="page-title">Shape a moment people genuinely want to step into.</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Lead with the atmosphere, the boundaries, and the kind of person who would make the plan feel easy.
            </p>
          </div>
        </div>

        <Input name="title" aria-label="Experience title" placeholder="Rooftop dinner with city views" required />
        <Input name="vibeSummary" aria-label="Vibe summary" placeholder="Warm, curious, design-minded evening with room to connect" required />
        <Textarea
          name="description"
          aria-label="Experience description"
          placeholder="Describe the energy, expectations, and what a thoughtful offer should understand before reaching out."
          required
        />
        <GooglePlacesField
          label="Location"
          placeholder="Start typing an address"
          value={location}
          placeId={locationPlaceId}
          latitude={locationLatitude}
          longitude={locationLongitude}
          required
          onChange={(selection) => {
            setHasUnsavedChanges(true);
            setLocation(selection.address);
            setLocationPlaceId(selection.placeId);
            setLocationLatitude(selection.latitude);
            setLocationLongitude(selection.longitude);
            setLocationCity(selection.city);
            setLocationProvince(selection.province);
            setLocationCountry(selection.country);
          }}
        />

        <DateWindowField
          start={dateWindowStart}
          end={dateWindowEnd}
          expiresAt={expiresAt}
          onStartChange={(value) => {
            setHasUnsavedChanges(true);
            setDateWindowStart(value);
          }}
          onEndChange={(value) => {
            setHasUnsavedChanges(true);
            setDateWindowEnd(value);
          }}
          onExpiresAtChange={(value) => {
            setHasUnsavedChanges(true);
            setExpiresAt(value);
          }}
        />

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
          {timingSummary}
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Starting bid</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Optional. This stays subtle in the experience flow and quietly sets the floor for offers without turning the page into a range picker.
            </p>
          </div>
          <Input
            name="startingBid"
            aria-label="Starting bid"
            type="number"
            min="10"
            step="1"
            inputMode="numeric"
            value={startingBid}
            onChange={(event) => {
              setHasUnsavedChanges(true);
              setStartingBid(event.target.value);
            }}
            placeholder="Starting bid"
          />
        </div>

        {calendarMessage ? <p className="text-sm text-red-500">{calendarMessage}</p> : null}
      </Card>

      <Card as="section" className="space-y-5 p-6 sm:p-8">
        <div className="space-y-3">
          <Badge tone="success">
            <ShieldCheck className="h-3.5 w-3.5" />
            Safety settings
          </Badge>
          <p className="text-sm leading-7 text-slate-600">
            These signals appear up front so incoming offers feel aligned from the start.
          </p>
        </div>

        <div className="space-y-3">
          {SAFETY_OPTIONS.map((option) => {
            const checked = selectedSafety.includes(option);

            return (
              <label
                key={option}
                className="surface-subtle flex cursor-pointer items-center justify-between gap-4 px-4 py-4 transition hover:border-primary/30"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{option}</p>
                  <p className="mt-1 text-xs text-slate-500">Visible in the experience details</p>
                </div>
                <span
                  className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
                    checked ? "bg-primary/80" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${
                      checked ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSafety(option)}
                  className="sr-only"
                />
              </label>
            );
          })}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Publishing..." : "Publish experience"}
        </Button>

        {message ? (
          <div
            className="fixed right-4 top-[calc(5rem+env(safe-area-inset-top))] z-50 max-w-sm rounded-2xl border border-red-200 bg-white p-4 text-sm leading-6 text-red-700 shadow-soft-lg"
            role="status"
          >
            {message}
          </div>
        ) : null}
      </Card>
    </form>
  );
}
