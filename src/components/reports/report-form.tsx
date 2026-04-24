"use client";

import { ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <Card as="form" onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="space-y-2">
        <Badge tone="warning">
          <ShieldAlert className="h-3.5 w-3.5" />
          Safety report
        </Badge>
        <p className="text-sm leading-6 text-slate-600">
          Flag concerns quietly so the moderation team can review them.
        </p>
      </div>
      <Input aria-label="Report reason" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
      <Textarea aria-label="Report details" placeholder="Details" value={details} onChange={(e) => setDetails(e.target.value)} />
      <Button type="submit" variant="secondary">
        Submit report
      </Button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </Card>
  );
}
