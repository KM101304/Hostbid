import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ExperienceCard } from "@/components/experiences/experience-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDiscoveryExperiences } from "@/lib/queries";

export default async function ExperiencesPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const experiences = await getDiscoveryExperiences();

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 lg:px-8 lg:py-10">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card as="section" className="overflow-hidden p-8 sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,168,212,0.22),transparent_42%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.08),transparent_28%)]" />
            <div className="relative space-y-5">
              <Badge tone="primary">
                <Compass className="h-3.5 w-3.5" />
                Explore experiences
              </Badge>
              <div>
                <h1 className="page-title max-w-4xl">Everything currently open for thoughtful offers.</h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  This is the stable browse view for live experiences, so users can always find listings again after posting, tapping away, or coming back later.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={user ? "/experiences/new" : "/signup"}>
                  <Button className="gap-2">
                    {user ? "Post an experience" : "Create an account"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={user ? "/dashboard" : "/"}>
                  <Button variant="secondary">{user ? "Open your hub" : "Back home"}</Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card as="section" className="p-7">
            <Badge tone="info">
              <Sparkles className="h-3.5 w-3.5" />
              Good discovery habits
            </Badge>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>1. Keep your deadline in the future so listings stay visible in the feed.</p>
              <p>2. Use the starting bid quietly when you want to set a floor without showing a loud price range.</p>
              <p>3. Make your first photo and timing feel intentional, because those are the fastest trust signals in cards.</p>
            </div>
          </Card>
        </section>

        {experiences.length > 0 ? (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {experiences.map((experience, index) => (
              <ExperienceCard key={experience.id} experience={experience} priority={index === 0} />
            ))}
          </section>
        ) : (
          <Card as="section" className="p-8 sm:p-10">
            <p className="section-eyebrow">Nothing live yet</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.04em] text-slate-900">
              The browse page is ready. It just needs the next thoughtful experience.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Once an experience is open and its deadline has not passed, it will appear here and in discovery.
            </p>
          </Card>
        )}
      </main>
    </AppShell>
  );
}
