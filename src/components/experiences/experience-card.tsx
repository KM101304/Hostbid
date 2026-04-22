import Image from "next/image";
import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
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
    budget_max_cents: number | null;
    profiles?: {
      full_name?: string | null;
      is_verified?: boolean | null;
      avatar_url?: string | null;
    } | null;
    bids?: { id: string; status: string }[] | null;
  };
};

export function ExperienceCard({ experience }: ExperienceCardProps) {
  const activeBidCount = (experience.bids ?? []).filter((bid) => bid.status === "active").length;

  return (
    <Link
      href={`/experiences/${experience.id}`}
      className="group overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_24px_70px_-38px_rgba(36,27,17,0.3)] transition hover:-translate-y-1 hover:shadow-[0_28px_85px_-36px_rgba(36,27,17,0.35)]"
    >
      <div className="relative h-56 overflow-hidden bg-stone-200">
        {experience.profiles?.avatar_url ? (
          <Image
            src={experience.profiles.avatar_url}
            alt={experience.profiles.full_name ?? "Host"}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 1024px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,18,12,0.08),rgba(24,18,12,0.46))]" />
        <div className="absolute left-5 top-5">
          <span className="inline-flex items-center rounded-full bg-white/88 px-3 py-1 text-xs font-semibold text-stone-800 backdrop-blur">
            {interestLabel(activeBidCount)}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-stone-950">{experience.title}</h2>
          </div>
          {experience.profiles?.is_verified ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified host
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Avatar
            src={experience.profiles?.avatar_url}
            alt={experience.profiles?.full_name ?? "Anonymous host"}
            className="h-11 w-11 ring-2 ring-stone-100"
            fallback={experience.profiles?.full_name?.slice(0, 1)}
          />
          <p className="text-sm font-medium text-stone-700">
            {experience.profiles?.full_name ?? "Anonymous host"} · {experience.vibe_summary ?? "Thoughtful plan"}
          </p>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{experience.description}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
            <MapPin className="h-3.5 w-3.5" />
            {experience.location}
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
            {formatRelativeWindow(experience.date_window_start, experience.date_window_end)}
          </span>
          {experience.budget_min_cents || experience.budget_max_cents ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Expected range{" "}
              {experience.budget_min_cents && experience.budget_max_cents
                ? `${formatCurrency(experience.budget_min_cents)} - ${formatCurrency(experience.budget_max_cents)}`
                : formatCurrency(experience.budget_max_cents ?? experience.budget_min_cents ?? 0)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
