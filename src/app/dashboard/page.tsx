import Link from "next/link";
import { Compass, MessageSquare, PlusCircle, ShieldCheck, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ExperienceActions } from "@/components/experiences/experience-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const { experiences, bids } = await getDashboardData(user.id);

  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-8 lg:grid-cols-2 lg:px-8 lg:py-10">
        <Card as="section" className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="section-eyebrow">Your experiences</p>
              <h1 className="mt-3 text-[36px] font-bold tracking-[-0.04em] text-slate-900">Hosting hub</h1>
            </div>
            <Link href="/experiences/new">
              <Button>New experience</Button>
            </Link>
          </div>

          <div className="space-y-4">
            {experiences.map((experience) => (
              <Card as="article" hover className="p-5" key={experience.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <Link href={`/experiences/${experience.id}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="info">{experience.status}</Badge>
                      <Badge tone="primary">
                        {(experience.bids ?? []).filter((bid) => bid.status === "active").length} live offers
                      </Badge>
                    </div>
                    <p className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
                      {experience.title}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {experience.location} · {formatDateTime(experience.created_at)}
                    </p>
                  </Link>
                  <ExperienceActions
                    experienceId={experience.id}
                    title={experience.title}
                    disabled={Boolean(experience.selected_bid_id || experience.winner_user_id)}
                  />
                </div>
              </Card>
            ))}

            {experiences.length === 0 ? (
              <Card className="space-y-5 border-dashed p-5 sm:p-6">
                <div className="space-y-2">
                  <Badge tone="primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    Ready to host
                  </Badge>
                  <p className="text-lg font-semibold tracking-[-0.02em] text-slate-900">
                    Your first listing will set the tone for the whole marketplace.
                  </p>
                  <p className="text-sm leading-6 text-slate-600">
                    Lead with atmosphere, add your boundaries, and give people a reason to trust the energy before they
                    bid.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link href="/experiences/new">
                    <Card as="div" className="h-full p-4">
                      <div className="flex items-center gap-2 text-slate-900">
                        <PlusCircle className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold">Start a new experience</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Draft the title, vibe, timing, and safety details in one pass.
                      </p>
                    </Card>
                  </Link>
                  <Link href="/profile">
                    <Card as="div" className="h-full p-4">
                      <div className="flex items-center gap-2 text-slate-900">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <p className="text-sm font-semibold">Strengthen your profile</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Add your identity signals first so the first offer lands with context.
                      </p>
                    </Card>
                  </Link>
                </div>
              </Card>
            ) : null}
          </div>
        </Card>

        <Card as="section" className="space-y-6 p-6 sm:p-8">
          <div>
            <p className="section-eyebrow">Your offers</p>
            <h2 className="mt-3 text-[36px] font-bold tracking-[-0.04em] text-slate-900">Offer activity</h2>
          </div>

          <div className="space-y-4">
            {bids.map((bid) => (
              <Link href={bid.experiences ? `/experiences/${bid.experiences.id}` : "/"} key={bid.id}>
                <Card as="article" hover className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="primary">
                      {bid.status === "active" && bid.experiences?.selected_bid_id === bid.id ? "Host accepted" : bid.status}
                    </Badge>
                    <Badge tone={bid.status === "selected" ? "success" : "warning"}>
                      {bid.status === "active" && bid.experiences?.selected_bid_id === bid.id
                        ? "Confirm to capture"
                        : bid.status === "selected"
                          ? "Payment confirmed"
                          : "Offer secured"}
                    </Badge>
                  </div>
                  <p className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
                    {bid.experiences?.title ?? "Offer"}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {bid.experiences?.location ?? "Location private"} · {formatDateTime(bid.created_at)}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">{formatCurrency(bid.amount_cents)} authorized</p>
                </Card>
              </Link>
            ))}

            {bids.length === 0 ? (
              <Card className="space-y-5 border-dashed p-5 sm:p-6">
                <div className="space-y-2">
                  <Badge tone="info">
                    <Compass className="h-3.5 w-3.5" />
                    Quiet for now
                  </Badge>
                  <p className="text-lg font-semibold tracking-[-0.02em] text-slate-900">
                    Offer activity appears once you start exploring live experiences.
                  </p>
                  <p className="text-sm leading-6 text-slate-600">
                    Browse what is live, refine your profile, and thoughtful offers will begin collecting here.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link href="/">
                    <Card as="div" className="h-full p-4">
                      <div className="flex items-center gap-2 text-slate-900">
                        <Compass className="h-4 w-4 text-sky-500" />
                        <p className="text-sm font-semibold">Check discovery</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        See what is open, active, and currently accepting offers.
                      </p>
                    </Card>
                  </Link>
                  <Link href="/messages">
                    <Card as="div" className="h-full p-4">
                      <div className="flex items-center gap-2 text-slate-900">
                        <MessageSquare className="h-4 w-4 text-slate-500" />
                        <p className="text-sm font-semibold">Watch conversations</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Accepted offers unlock message threads here once a plan moves forward.
                      </p>
                    </Card>
                  </Link>
                </div>
              </Card>
            ) : null}
          </div>
        </Card>
      </main>
    </AppShell>
  );
}
