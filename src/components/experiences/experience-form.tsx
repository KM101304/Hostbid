"use client";

import { useState } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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

        <Input name="title" placeholder="Rooftop dinner with city views" required />
        <Input name="vibeSummary" placeholder="Warm, curious, design-minded evening with room to connect" required />
        <Textarea
          name="description"
          placeholder="Describe the energy, expectations, and what a thoughtful offer should understand before reaching out."
          required
        />
        <Input name="location" placeholder="Los Angeles, CA" required />

        <div className="grid gap-4 md:grid-cols-2">
          <Input name="dateWindowStart" type="datetime-local" />
          <Input name="dateWindowEnd" type="datetime-local" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input name="budgetMinCents" type="number" min="0" placeholder="Preferred lower range (USD)" />
          <Input name="budgetMaxCents" type="number" min="0" placeholder="Preferred upper range (USD)" />
        </div>

        <Input name="expiresAt" type="datetime-local" />
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

        {message ? <p className="text-sm text-red-500">{message}</p> : null}
      </Card>
    </form>
  );
}
