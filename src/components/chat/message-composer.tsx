"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";

export function MessageComposer({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);

    const response = await fetch(`/api/messages/${threadId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body }),
    });

    setSending(false);

    if (!response.ok) {
      alert("Message failed to send.");
      return;
    }

    setBody("");
    router.refresh();
  }

  return (
    <Card as="form" onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6">
      <Textarea
        aria-label="Message"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share a thoughtful next step, confirm details, or keep the conversation comfortable and clear."
      />
      <Button type="submit" disabled={sending || !body.trim()}>
        {sending ? "Sending..." : "Send message"}
      </Button>
    </Card>
  );
}
