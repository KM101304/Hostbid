"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export function ReportForm({
  experienceId,
  reportedUserId,
}: {
  experienceId?: string;
  reportedUserId?: string;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason,
        details,
        experienceId,
        reportedUserId,
      }),
    });

    const payload = await response.json();
    setMessage(response.ok ? "Report filed." : payload.error ?? "Unable to file report.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-[2rem] border border-stone-200 bg-white p-5">
      <Input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      <Textarea placeholder="Details" value={details} onChange={(e) => setDetails(e.target.value)} />
      <Button type="submit" variant="secondary">
        Submit report
      </Button>
      {message ? <p className="text-sm text-stone-600">{message}</p> : null}
    </form>
  );
}
