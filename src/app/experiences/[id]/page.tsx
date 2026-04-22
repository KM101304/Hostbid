import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { BidList } from "@/components/bids/bid-list";
import { BidPaymentForm } from "@/components/bids/bid-payment-form";
import { RealtimeBids } from "@/components/bids/realtime-bids";
import { ReportForm } from "@/components/reports/report-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";
import { getExperienceDetail } from "@/lib/queries";
import { formatCurrency, formatRelativeWindow } from "@/lib/utils";

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  const { experience, bids } = await getExperienceDetail(id);

  if (!experience) {
    notFound();
  }

  const isOwner = user?.id === experience.user_id;
  const myBid = bids.find((bid) => bid.bidder_id === user?.id);

  return (
    <AppShell>
      <RealtimeBids experienceId={id} />
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-10">
        <section className="space-y-6">
          <Card as="article" className="overflow-hidden p-0">
            {experience.profiles?.photo_urls?.length ? (
              <div className="grid gap-3 p-3 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
                <Image
                  src={experience.profiles.photo_urls[0]}
                  alt={experience.title}
                  width={900}
                  height={720}
                  className="h-72 w-full rounded-[20px] object-cover md:h-[420px]"
                />
                {experience.profiles.photo_urls.slice(1, 3).map((url) => (
                  <Image
                    key={url}
                    src={url}
                    alt={experience.title}
                    width={600}
                    height={720}
                    className="h-72 w-full rounded-[20px] object-cover md:h-[420px]"
                  />
                ))}
              </div>
            ) : (
              <div className="h-72 bg-[radial-gradient(circle_at_top_left,rgba(249,168,212,0.4),transparent_32%),linear-gradient(135deg,rgba(255,255,255,1),rgba(241,245,249,1))]" />
            )}

            <div className="space-y-5 p-7 sm:p-8">
              <div className="flex flex-wrap gap-2">
                <Badge tone="primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Experience
                </Badge>
                <Badge tone="info">
                  <Star className="h-3.5 w-3.5" />
                  {experience.status}
                </Badge>
                {experience.profiles?.is_verified ? (
                  <Badge tone="success">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified host
                  </Badge>
                ) : null}
              </div>

              <div>
                <h1 className="page-title">{experience.title}</h1>
                <p className="mt-4 text-lg leading-8 text-slate-600">{experience.vibe_summary}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge>
                  <MapPin className="h-3.5 w-3.5" />
                  {experience.location}
                </Badge>
                <Badge>
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatRelativeWindow(experience.date_window_start, experience.date_window_end)}
                </Badge>
                {experience.budget_min_cents || experience.budget_max_cents ? (
                  <Badge tone="primary">
                    Preferred range {formatCurrency(experience.budget_min_cents ?? 0)} -{" "}
                    {formatCurrency(experience.budget_max_cents ?? 0)}
                  </Badge>
                ) : null}
              </div>

              <p className="whitespace-pre-wrap text-sm leading-8 text-slate-600">{experience.description}</p>
            </div>
          </Card>

          <Card as="section" className="space-y-5 p-6 sm:p-8">
            <div>
              <p className="section-eyebrow">Offers</p>
              <h2 className="mt-3 text-[32px] font-bold tracking-[-0.04em] text-slate-900">
                {isOwner ? "Review incoming offers with context." : myBid ? "Your active offer" : "Current offer pool"}
              </h2>
            </div>
            <BidList bids={bids} isOwner={isOwner} />
          </Card>
        </section>

        <section className="space-y-6">
          {user && !isOwner ? <BidPaymentForm experienceId={id} /> : null}

          <Card as="section" className="space-y-5 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <Avatar
                src={experience.profiles?.avatar_url}
                alt={experience.profiles?.full_name ?? "Host"}
                className="h-16 w-16"
                fallback={experience.profiles?.full_name?.slice(0, 1)}
              />
              <div>
                <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
                  {experience.profiles?.full_name ?? "Host"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {experience.profiles?.location ?? "Location private"} · Profile {experience.profiles?.quality_score ?? 0}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {experience.profiles?.is_verified ? <Badge tone="success">Verified</Badge> : null}
              <Badge tone="info">Profile quality indicator</Badge>
            </div>
            <p className="text-sm leading-8 text-slate-600">{experience.profiles?.bio ?? "Profile bio coming soon."}</p>
          </Card>

          <ReportForm experienceId={experience.id} reportedUserId={experience.user_id} />
        </section>
      </main>
    </AppShell>
  );
}
