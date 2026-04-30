import Link from "next/link";
import { ArrowRight, Compass, ShieldCheck, Sparkles, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ExperienceCard } from "@/components/experiences/experience-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAuthenticatedUser, getCurrentProfile } from "@/lib/auth";
import { getDashboardData, getDiscoveryExperiences } from "@/lib/queries";

export default async function HomePage() {
  const user = await getAuthenticatedUser();
  const [experiences, profile] = await Promise.all([
    user ? getDiscoveryExperiences() : Promise.resolve([]),
    user ? getCurrentProfile() : Promise.resolve(null),
  ]);

  const dashboard = user ? await getDashboardData(user.id) : null;
  const activeHostingCount = dashboard?.experiences.filter((experience) => experience.status === "open").length ?? 0;
  const liveOfferCount =
    dashboard?.bids.filter((bid) => ["active", "selected"].includes(bid.status)).length ?? 0;
  const profileName = profile?.full_name ?? user?.user_metadata?.full_name ?? "there";

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 lg:px-8 lg:py-10">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card as="section" className="fade-slide overflow-hidden p-8 sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,168,212,0.22),transparent_42%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.08),transparent_28%)]" />
            <div className="relative space-y-6">
              <Badge tone="primary">
                <Sparkles className="h-3.5 w-3.5" />
                {user ? "Welcome back" : "Premium social experiences"}
              </Badge>
              <div className="space-y-4">
                <h1 className="page-title max-w-4xl">
                  {user
                    ? `${profileName}, here is what is live and what needs your attention.`
                    : "Curated experiences. Thoughtful offers. A platform built to feel human."}
                </h1>
                <p className="page-copy max-w-3xl">
                  {user
                    ? "Jump back into discovery, keep your experiences visible, and stay on top of offers and payouts without hunting through the app."
                    : "Discover plans with personality, review offers with context, and connect through trust instead of urgency."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={user ? "/experiences" : "/signup"}>
                  <Button className="gap-2">
                    {user ? "Browse experiences" : "Create experience"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={user ? "/dashboard" : "/signup"}>
                  <Button variant="secondary">{user ? "Open your hub" : "Start your profile"}</Button>
                </Link>
                {user ? (
                  <Link href="/experiences/new">
                    <Button variant="ghost">Post a new experience</Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
            {user ? (
              <Card as="section" className="fade-slide p-7">
                <Badge tone="success">
                  <Star className="h-3.5 w-3.5" />
                  Your snapshot
                </Badge>
                <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live experiences</p>
                    <p className="mt-2 text-[32px] font-semibold tracking-[-0.03em] text-slate-900">{activeHostingCount}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Your live offers</p>
                    <p className="mt-2 text-[32px] font-semibold tracking-[-0.03em] text-slate-900">{liveOfferCount}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Payouts</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Balances and Stripe status now live in your profile.</p>
                  </div>
                </div>
              </Card>
            ) : null}
            {!user ? (
              <>
                <Card as="section" className="fade-slide bg-[linear-gradient(135deg,rgba(249,168,212,0.18),rgba(255,255,255,1),rgba(241,245,249,0.92))] p-7">
                  <Badge tone="info">
                    <Star className="h-3.5 w-3.5" />
                    What makes it different
                  </Badge>
                  <p className="mt-5 text-[24px] font-semibold leading-9 tracking-[-0.04em] text-slate-900">
                    Offers add signal, but personal fit, safety, and style still guide the final choice.
                  </p>
                </Card>

                <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                  <Card as="section" className="fade-slide p-5">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <p className="mt-4 text-sm font-semibold text-slate-900">Trust layer</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Verification, profile quality, and safety preferences stay visible without overwhelming the moment.
                    </p>
                  </Card>
                  <Card as="section" className="fade-slide p-5">
                    <Compass className="h-5 w-5 text-primary-dark" />
                    <p className="mt-4 text-sm font-semibold text-slate-900">Experience-first</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Each card is framed like a plan you could imagine yourself in, not an item in a marketplace.
                    </p>
                  </Card>
                  <Card as="section" className="fade-slide p-5">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <p className="mt-4 text-sm font-semibold text-slate-900">Soft flow</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Conversations open only after an offer is accepted, keeping discovery calm and intentional.
                    </p>
                  </Card>
                </div>
              </>
            ) : null}
          </div>
        </section>

        {user && experiences.length > 0 ? (
          <>
            <Card as="section" className="fade-slide grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto]">
              <Input placeholder="Filter by location" />
              <Input type="datetime-local" />
              <Link href="/experiences">
                <Button variant="secondary">Open browse page</Button>
              </Link>
            </Card>

            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {experiences.map((experience, index) => (
                <ExperienceCard key={experience.id} experience={experience} priority={index === 0} />
              ))}
            </section>
          </>
        ) : !user ? null : (
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card as="section" className="p-8 sm:p-10">
              <p className="section-eyebrow">Fresh community</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.04em] text-slate-900">
                No experiences are live yet, so your first one sets the tone.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                Complete your profile, publish a thoughtful plan, and give the marketplace a first experience that feels intentional from the start.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={user ? "/experiences/new" : "/signup"}>
                  <Button className="gap-2">
                    Publish the first experience
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={user ? "/profile" : "/signup"}>
                  <Button variant="secondary">{user ? "Refine your profile" : "Create your profile"}</Button>
                </Link>
              </div>
            </Card>

            <Card as="section" className="space-y-4 p-6 sm:p-8">
              <div>
                <p className="section-eyebrow">Launch checklist</p>
                <h3 className="mt-3 text-[28px] font-bold tracking-[-0.04em] text-slate-900">
                  What makes the first listing feel real
                </h3>
              </div>

              <div className="grid gap-4">
                <Card as="article" className="p-5">
                  <p className="text-sm font-semibold text-slate-900">1. Give the host profile shape</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Add your bio, location, and trust signals so the first offer already has context.
                  </p>
                </Card>
                <Card as="article" className="p-5">
                  <p className="text-sm font-semibold text-slate-900">2. Lead with atmosphere</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Frame the plan like an invitation, with boundaries and timing that feel clear before anyone bids.
                  </p>
                </Card>
                <Card as="article" className="p-5">
                  <p className="text-sm font-semibold text-slate-900">3. Keep the first flow calm</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Thoughtful offers, visible safety preferences, and message unlocks after acceptance keep the product true to its tone.
                  </p>
                </Card>
              </div>
            </Card>
          </section>
        )}
      </main>
    </AppShell>
  );
}
