import Link from "next/link";
import { CalendarDays, MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RemoteImage } from "@/components/ui/remote-image";
import { formatCurrency, formatRelativeWindow, interestLabel } from "@/lib/utils";

type ExperienceCardProps = {
  experience: {
    id: string;
    title: string;
    description: string;
    vibe_summary: string | null;
    location: string;
    date_window_start: string | null;
    date_window_end: string | null;
    budget_min_cents: number | null;
    profiles?: {
      full_name?: string | null;
      avatar_url?: string | null;
      photo_urls?: string[] | null;
      quality_score?: number | null;
      is_verified?: boolean | null;
    } | null;
    bids?: { id: string; status: string }[] | null;
  };
  priority?: boolean;
};

export function ExperienceCard({ experience, priority = false }: ExperienceCardProps) {
  const activeBidCount = (experience.bids ?? []).filter((bid) => bid.status === "active").length;
  const heroUrl = experience.profiles?.photo_urls?.[0] ?? experience.profiles?.avatar_url;

  return (
    <Link
      href={`/experiences/${experience.id}`}
      className="surface-card surface-card-hover fade-slide group block overflow-hidden"
    >
      <div className="relative h-64 overflow-hidden bg-slate-100">
        {heroUrl ? (
          <RemoteImage
            src={heroUrl}
            alt={experience.profiles?.full_name ?? "Host"}
            width={1200}
            height={960}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            priority={priority}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,168,212,0.45),transparent_36%),linear-gradient(135deg,rgba(255,255,255,1),rgba(241,245,249,1))]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.6))]" />
        <div className="absolute inset-x-5 top-5 flex items-start justify-between gap-3">
          <Badge className="bg-white/88">
            <Sparkles className="h-3.5 w-3.5" />
            {interestLabel(activeBidCount)}
          </Badge>
        </div>
        <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">Experience</p>
            <h2 className="mt-2 text-[32px] font-bold leading-none tracking-[-0.04em] text-white">
              {experience.title}
            </h2>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="flex items-center gap-3">
          <Avatar
            src={experience.profiles?.avatar_url}
            alt={experience.profiles?.full_name ?? "Anonymous host"}
            className="h-12 w-12"
            fallback={experience.profiles?.full_name?.slice(0, 1)}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {experience.profiles?.full_name ?? "Anonymous host"}
            </p>
            <p className="truncate text-sm text-slate-500">
              {experience.vibe_summary ?? "Thoughtful plan"} · Profile {experience.profiles?.quality_score ?? 0}
            </p>
          </div>
        </div>

        <p className="line-clamp-3 text-sm leading-7 text-slate-600">{experience.description}</p>

        <div className="flex flex-wrap gap-2">
          {experience.profiles?.is_verified ? (
            <Badge tone="success">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified
            </Badge>
          ) : null}
          <Badge>
            <MapPin className="h-3.5 w-3.5" />
            {experience.location}
          </Badge>
          <Badge>
            <CalendarDays className="h-3.5 w-3.5" />
            {formatRelativeWindow(experience.date_window_start, experience.date_window_end)}
          </Badge>
          <Badge tone="info">
            <Star className="h-3.5 w-3.5" />
            {activeBidCount > 0 ? `${activeBidCount} active offers` : "Open to offers"}
          </Badge>
          {experience.budget_min_cents ? (
            <Badge tone="primary">
              Starting bid {formatCurrency(experience.budget_min_cents)}
            </Badge>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
