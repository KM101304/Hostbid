"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RemoteImage } from "@/components/ui/remote-image";

type ExperienceGalleryProps = {
  title: string;
  photoUrls: string[];
};

export function ExperienceGallery({ title, photoUrls }: ExperienceGalleryProps) {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  if (photoUrls.length === 0) {
    return (
      <div className="h-72 bg-[radial-gradient(circle_at_top_left,rgba(249,168,212,0.4),transparent_32%),linear-gradient(135deg,rgba(255,255,255,1),rgba(241,245,249,1))]" />
    );
  }

  return (
    <>
      <div className="grid gap-3 p-3 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
        {photoUrls.slice(0, 3).map((url, index) => (
          <button
            key={url}
            type="button"
            className="group overflow-hidden rounded-[20px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-400"
            onClick={() => setActiveUrl(url)}
            aria-label={`Open ${title} photo ${index + 1}`}
          >
            <RemoteImage
              src={url}
              alt={title}
              width={index === 0 ? 900 : 600}
              height={720}
              priority={index === 0}
              className="h-72 w-full object-cover object-top transition duration-300 group-hover:scale-[1.02] md:h-[420px]"
            />
          </button>
        ))}
      </div>

      {activeUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/82 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photo preview`}
          onClick={() => setActiveUrl(null)}
        >
          <Card className="relative max-h-[92dvh] w-full max-w-5xl overflow-hidden border-white/10 bg-slate-950 p-2">
            <Button
              type="button"
              variant="secondary"
              className="absolute right-4 top-4 z-10 h-11 rounded-full px-3"
              onClick={() => setActiveUrl(null)}
              aria-label="Close photo preview"
            >
              <X className="h-4 w-4" />
            </Button>
            <RemoteImage
              src={activeUrl}
              alt={title}
              width={1400}
              height={1800}
              priority
              className="max-h-[88dvh] w-full rounded-[24px] object-contain"
            />
          </Card>
        </div>
      ) : null}
    </>
  );
}
