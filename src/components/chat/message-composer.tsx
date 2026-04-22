"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    <form onSubmit={handleSubmit} className="space-y-3 rounded-[2rem] border border-stone-200 bg-white p-5">
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Keep plans clear, specific, and respectful." />
      <Button type="submit" disabled={sending || !body.trim()}>
        {sending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
