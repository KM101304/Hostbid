"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

const SAFETY_OPTIONS = [
  "Public venue only",
  "No alcohol",
  "Daytime only",
  "Venue booked in advance",
];

export function ExperienceForm() {
  const router = useRouter();
  const [selectedSafety, setSelectedSafety] = useState<string[]>(["Public venue only"]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/experiences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description"),
        location: formData.get("location"),
        vibeSummary: formData.get("vibeSummary"),
        dateWindowStart: formData.get("dateWindowStart"),
        dateWindowEnd: formData.get("dateWindowEnd"),
        budgetMinCents: Number(formData.get("budgetMinCents") || 0) * 100,
        budgetMaxCents: Number(formData.get("budgetMaxCents") || 0) * 100,
        expiresAt: formData.get("expiresAt"),
        safetyPreferences: selectedSafety,
      }),
    });

    const payload = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to create experience.");
      return;
    }

    router.push(`/experiences/${payload.experience.id}`);
    router.refresh();
  }

  function toggleSafety(option: string) {
    setSelectedSafety((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-4 rounded-[2rem] border border-stone-200 bg-white p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">New experience</p>
          <h1 className="font-serif text-4xl text-stone-950">Frame the kind of time together that feels worth competing for.</h1>
        </div>
        <Input name="title" placeholder="Dinner at Cactus Club" required />
        <Input name="vibeSummary" placeholder="Confident, low-pressure, design-minded evening" required />
        <Textarea name="description" placeholder="Set the energy, expectations, and what a great host would understand." required />
        <Input name="location" placeholder="Vancouver, BC" required />
        <div className="grid gap-4 md:grid-cols-2">
          <Input name="dateWindowStart" type="datetime-local" />
          <Input name="dateWindowEnd" type="datetime-local" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input name="budgetMinCents" type="number" min="0" placeholder="Min expected spend (USD)" />
          <Input name="budgetMaxCents" type="number" min="0" placeholder="Max expected spend (USD)" />
        </div>
        <Input name="expiresAt" type="datetime-local" />
      </section>

      <section className="space-y-4 rounded-[2rem] border border-stone-200 bg-white p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Safety preferences</p>
          <p className="mt-2 text-sm text-stone-600">
            These appear up front so offers stay aligned with your comfort level.
          </p>
        </div>
        <div className="space-y-3">
          {SAFETY_OPTIONS.map((option) => (
            <label key={option} className="flex items-center justify-between rounded-3xl border border-stone-200 px-4 py-3">
              <span className="text-sm text-stone-800">{option}</span>
              <input
                type="checkbox"
                checked={selectedSafety.includes(option)}
                onChange={() => toggleSafety(option)}
              />
            </label>
          ))}
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Publishing..." : "Publish experience"}
        </Button>
        {message ? <p className="text-sm text-rose-600">{message}</p> : null}
      </section>
    </form>
  );
}
