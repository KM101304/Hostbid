import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
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
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-10 lg:grid-cols-2 lg:px-8">
        <section className="rounded-[2rem] border border-stone-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Your experiences</p>
              <h1 className="mt-3 font-serif text-4xl text-stone-950">Hosted plans</h1>
            </div>
            <Link href="/experiences/new">
              <Button>New experience</Button>
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {experiences.map((experience) => (
              <Link
                href={`/experiences/${experience.id}`}
                key={experience.id}
                className="block rounded-[1.5rem] border border-stone-200 p-4 hover:bg-stone-50"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{experience.status}</p>
                <p className="mt-2 text-lg font-semibold text-stone-950">{experience.title}</p>
                <p className="mt-2 text-sm text-stone-600">
                  {experience.location} · {formatDateTime(experience.created_at)}
                </p>
                <p className="mt-2 text-sm text-stone-500">
                  {(experience.bids ?? []).filter((bid) => bid.status === "active").length} live offers
                </p>
              </Link>
            ))}
            {experiences.length === 0 ? (
              <p className="rounded-[1.5rem] border border-dashed border-stone-300 p-5 text-sm text-stone-500">
                You haven’t posted an experience yet.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-white p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Your offers</p>
          <h2 className="mt-3 font-serif text-4xl text-stone-950">Competitive pool activity</h2>
          <div className="mt-6 space-y-4">
            {bids.map((bid) => (
              <Link
                href={bid.experiences ? `/experiences/${bid.experiences.id}` : "/"}
                key={bid.id}
                className="block rounded-[1.5rem] border border-stone-200 p-4 hover:bg-stone-50"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{bid.status}</p>
                <p className="mt-2 text-lg font-semibold text-stone-950">{bid.experiences?.title ?? "Offer"}</p>
                <p className="mt-2 text-sm text-stone-600">
                  {bid.experiences?.location ?? "Location private"} · {formatDateTime(bid.created_at)}
                </p>
                <p className="mt-2 text-sm text-stone-500">{formatCurrency(bid.amount_cents)} secured</p>
              </Link>
            ))}
            {bids.length === 0 ? (
              <p className="rounded-[1.5rem] border border-dashed border-stone-300 p-5 text-sm text-stone-500">
                You have not submitted any offers yet.
              </p>
            ) : null}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
