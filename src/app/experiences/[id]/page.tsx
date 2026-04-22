import Image from "next/image";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { BidList } from "@/components/bids/bid-list";
import { BidPaymentForm } from "@/components/bids/bid-payment-form";
import { RealtimeBids } from "@/components/bids/realtime-bids";
import { ReportForm } from "@/components/reports/report-form";
import { Avatar } from "@/components/ui/avatar";
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
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="space-y-6">
          <article className="rounded-[2rem] border border-stone-200 bg-white p-7">
            {experience.profiles?.photo_urls?.length ? (
              <div className="mb-6 grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
                <Image
                  src={experience.profiles.photo_urls[0]}
                  alt={experience.title}
                  width={900}
                  height={720}
                  className="h-72 w-full rounded-[1.75rem] object-cover"
                />
                {experience.profiles.photo_urls.slice(1, 3).map((url) => (
                  <Image
                    key={url}
                    src={url}
                    alt={experience.title}
                    width={600}
                    height={720}
                    className="h-72 w-full rounded-[1.75rem] object-cover"
                  />
                ))}
              </div>
            ) : null}
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">{experience.status}</p>
            <h1 className="mt-3 font-serif text-5xl tracking-tight text-stone-950">{experience.title}</h1>
            <p className="mt-4 text-lg text-stone-700">{experience.vibe_summary}</p>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-stone-600">{experience.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">{experience.location}</span>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">
                {formatRelativeWindow(experience.date_window_start, experience.date_window_end)}
              </span>
              {experience.budget_min_cents || experience.budget_max_cents ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
                  Expected range{" "}
                  {formatCurrency(experience.budget_min_cents ?? 0)} - {formatCurrency(experience.budget_max_cents ?? 0)}
                </span>
              ) : null}
            </div>
          </article>

          <section className="rounded-[2rem] border border-stone-200 bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Offers</p>
                <h2 className="mt-2 font-serif text-3xl text-stone-950">
                  {isOwner ? "Review bidders with context." : myBid ? "Your live offer" : "Current selection pool"}
                </h2>
              </div>
            </div>
            <div className="mt-5">
              <BidList bids={bids} isOwner={isOwner} />
            </div>
          </section>
        </section>

        <section className="space-y-6">
          {user && !isOwner ? <BidPaymentForm experienceId={id} /> : null}
          <section className="rounded-[2rem] border border-stone-200 bg-white p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Host</p>
            <div className="mt-4 flex items-center gap-4">
              <Avatar
                src={experience.profiles?.avatar_url}
                alt={experience.profiles?.full_name ?? "Host"}
                className="h-16 w-16"
                fallback={experience.profiles?.full_name?.slice(0, 1)}
              />
              <div>
                <h2 className="font-serif text-3xl text-stone-950">{experience.profiles?.full_name ?? "Host"}</h2>
                <p className="mt-1 text-sm text-stone-500">
                  {experience.profiles?.location ?? "Location private"} · Quality score {experience.profiles?.quality_score ?? 0}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-stone-600">{experience.profiles?.bio ?? "Profile bio coming soon."}</p>
          </section>
          <ReportForm experienceId={experience.id} reportedUserId={experience.user_id} />
        </section>
      </main>
    </AppShell>
  );
}
