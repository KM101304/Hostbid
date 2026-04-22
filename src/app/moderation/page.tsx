import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
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
      <main className="mx-auto w-full max-w-6xl px-5 py-10 lg:px-8">
        <section className="rounded-[2rem] border border-stone-200 bg-white p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Safety queue</p>
          <h1 className="mt-3 font-serif text-5xl text-stone-950">Reports and moderation triage</h1>
          <div className="mt-6 space-y-4">
            {reports.map((report) => (
              <article key={report.id} className="rounded-[1.5rem] border border-stone-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{report.reason}</p>
                    <p className="mt-2 text-sm text-stone-600">{report.details ?? "No extra details supplied."}</p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">{report.status}</span>
                </div>
              </article>
            ))}
            {reports.length === 0 ? <p className="text-sm text-stone-500">No active reports.</p> : null}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
