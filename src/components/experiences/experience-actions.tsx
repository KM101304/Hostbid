"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExperienceActions({
  experienceId,
  title,
  disabled = false,
  redirectTo,
}: {
  experienceId: string;
  title: string;
  disabled?: boolean;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function removeExperience() {
    const confirmed = window.confirm(`Remove "${title}"? Active payment holds will be released first.`);

    if (!confirmed) {
      return;
    }

    setRemoving(true);
    setMessage(null);

    const response = await fetch(`/api/experiences/${experienceId}`, { method: "DELETE" });
    const payload = await response.json();

    setRemoving(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to remove experience.");
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="danger"
        className="w-full gap-2 sm:w-auto"
        onClick={removeExperience}
        disabled={disabled || removing}
      >
        <Trash2 className="h-4 w-4" />
        {removing ? "Removing..." : "Remove"}
      </Button>
      {message ? <p className="text-sm text-red-500">{message}</p> : null}
    </div>
  );
}
