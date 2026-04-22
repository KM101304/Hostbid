import Link from "next/link";
import { ArrowRight, Clock3, Filter, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ExperienceCard } from "@/components/experiences/experience-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDiscoveryExperiences } from "@/lib/queries";

export default async function HomePage() {
  const [experiences, user] = await Promise.all([getDiscoveryExperiences(), getAuthenticatedUser()]);

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-10 lg:px-8">
        <section className="grid gap-8 rounded-[2.5rem] border border-stone-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(241,233,223,0.9))] p-8 shadow-[0_30px_120px_-55px_rgba(35,23,12,0.45)] lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.28em] text-stone-500">Structured chemistry, not swipe entropy</p>
            <h1 className="max-w-3xl font-serif text-5xl leading-none tracking-tight text-stone-950 md:text-7xl">
              Experiences worth hosting. Offers worth considering.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-stone-600">
              HostBid lets people post the kind of date they actually want, then review real-money offers with context, profile depth, and final human discretion.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={user ? "/experiences/new" : "/signup"}>
                <Button className="gap-2">
                  Post an experience
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="secondary">Complete your profile</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[2rem] bg-stone-950 p-6 text-stone-50">
              <p className="text-sm uppercase tracking-[0.24em] text-stone-400">Product principle</p>
              <p className="mt-3 font-serif text-3xl">Money opens the door. Taste decides who walks through it.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
              <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5">
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-sm font-semibold text-stone-900">Manual capture</p>
                <p className="mt-2 text-sm text-stone-600">Bids are held first, captured only after selection.</p>
              </div>
              <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5">
                <Filter className="h-5 w-5 text-stone-900" />
                <p className="mt-3 text-sm font-semibold text-stone-900">Experience-first</p>
                <p className="mt-2 text-sm text-stone-600">Cards center vibe, setting, and safety boundaries.</p>
              </div>
              <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5">
                <Clock3 className="h-5 w-5 text-stone-900" />
                <p className="mt-3 text-sm font-semibold text-stone-900">Chat unlocks later</p>
                <p className="mt-2 text-sm text-stone-600">Messaging opens only once one offer is selected.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-[2rem] border border-stone-200 bg-white p-5 md:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Filter by location" />
          <Input type="datetime-local" />
          <Button variant="secondary">Filter feed</Button>
        </section>

        <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {experiences.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
          ))}
        </section>

        {experiences.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-stone-300 bg-white/80 p-10 text-center">
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Fresh marketplace</p>
            <h2 className="mt-4 font-serif text-4xl text-stone-950">No experiences live yet.</h2>
            <p className="mt-3 text-stone-600">Connect Supabase, create your profile, and publish the first experience.</p>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
