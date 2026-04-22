import Link from "next/link";
import { Compass, MessageSquareMore, ShieldCheck, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";
import { getThreadsForUser } from "@/lib/queries";

export default async function MessagesPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const threads = await getThreadsForUser(user.id);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-5xl px-5 py-8 lg:px-8 lg:py-10">
        <Card as="section" className="space-y-6 p-6 sm:p-8">
          <div>
            <p className="section-eyebrow">Messages</p>
            <h1 className="mt-3 text-[36px] font-bold tracking-[-0.04em] text-slate-900">Accepted conversations</h1>
          </div>

          <div className="space-y-4">
            {threads.map((thread) => (
              <Link href={`/messages/${thread.id}`} key={thread.id}>
                <Card as="article" hover className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="success">Accepted</Badge>
                      <Badge tone="info">{thread.experiences?.location ?? "Location private"}</Badge>
                    </div>
                    <p className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
                      {thread.experiences?.title ?? "Conversation"}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">{thread.unlocked_at.slice(0, 10)}</p>
                </Card>
              </Link>
            ))}

            {threads.length === 0 ? (
              <>
                <Card className="space-y-5 border-dashed p-6 sm:p-7">
                  <div className="space-y-2">
                    <Badge tone="primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      Quiet inbox
                    </Badge>
                    <p className="text-lg font-semibold tracking-[-0.02em] text-slate-900">
                      Conversations unlock once an offer is accepted.
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      HostBid keeps discovery calm up front. Messages open only after both sides have enough signal to
                      move with intention.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/">
                      <Button>Browse discovery</Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="secondary">Open your hub</Button>
                    </Link>
                  </div>
                </Card>

                <div className="grid gap-4 lg:grid-cols-3">
                  <Card className="p-5">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Compass className="h-4 w-4 text-sky-500" />
                      <p className="text-sm font-semibold">1. Find a fit</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Start with experiences that match your timing, budget, and safety preferences.
                    </p>
                  </Card>
                  <Card className="p-5">
                    <div className="flex items-center gap-2 text-slate-900">
                      <MessageSquareMore className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">2. Make a thoughtful offer</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Share the context that helps the host understand your style before any message thread opens.
                    </p>
                  </Card>
                  <Card className="p-5">
                    <div className="flex items-center gap-2 text-slate-900">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <p className="text-sm font-semibold">3. Unlock the thread</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Once an offer is accepted, the conversation appears here with the shared plan details attached.
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
