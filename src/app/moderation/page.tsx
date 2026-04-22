import Link from "next/link";
import { Compass, ShieldCheck, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasSupabaseAdminEnv } from "@/lib/env";

export default async function ModerationPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  let reports: Array<{
    id: string;
    reason: string;
    details: string | null;
    status: string;
  }> = [];

  if (hasSupabaseAdminEnv()) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);
    reports = (data ?? []) as typeof reports;
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
        <Card as="section" className="space-y-6 p-6 sm:p-8">
          <div>
            <p className="section-eyebrow">Safety</p>
            <h1 className="mt-3 text-[36px] font-bold tracking-[-0.04em] text-slate-900">Moderation queue</h1>
          </div>

          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} as="article" className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{report.reason}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {report.details ?? "No extra details supplied."}
                    </p>
                  </div>
                  <Badge tone="warning">{report.status}</Badge>
                </div>
              </Card>
            ))}

            {reports.length === 0 ? (
              <>
                <Card className="space-y-5 border-dashed p-6 sm:p-7">
                  <div className="space-y-2">
                    <Badge tone="success">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      All clear
                    </Badge>
                    <p className="text-lg font-semibold tracking-[-0.02em] text-slate-900">
                      No active reports need review right now.
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      Safety coverage is still visible even when the queue is empty. This is the place to watch for
                      escalations, policy flags, and moderation follow-through as the marketplace grows.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/">
                      <Button>Back to discovery</Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="secondary">Open your hub</Button>
                    </Link>
                  </div>
                </Card>

                <div className="grid gap-4 lg:grid-cols-3">
                  <Card className="p-5">
                    <div className="flex items-center gap-2 text-slate-900">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <p className="text-sm font-semibold">Response standard</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Reports should stay visible, calm, and traceable from first review through resolution.
                    </p>
                  </Card>
                  <Card className="p-5">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">Signals that matter</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Profile quality, safety preferences, and clear offer context should reduce ambiguity before it
                      becomes a report.
                    </p>
                  </Card>
                  <Card className="p-5">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Compass className="h-4 w-4 text-sky-500" />
                      <p className="text-sm font-semibold">Recovery path</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      When there is nothing to review, the next best move is usually strengthening listings and trust
                      signals across the marketplace.
                    </p>
                  </Card>
                </div>
              </>
            ) : null}
          </div>
        </Card>
      </main>
    </AppShell>
  );
}
