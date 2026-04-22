import Link from "next/link";
import { ArrowLeft, Compass, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <AppShell>
      <main className="mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-6xl items-center px-5 py-8 lg:px-8 lg:py-10">
        <section className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card as="section" className="overflow-hidden p-8 sm:p-10">
            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(249,168,212,0.34),transparent_55%)]" />
            <div className="relative">
              <Badge tone="primary">Page not found</Badge>
              <h1 className="mt-5 page-title max-w-3xl">The route exists in spirit, but not at this address.</h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                The link may be outdated, the experience may have closed, or the page may have moved. The next best move is to head back to discovery and pick up from there.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/">
                  <Button className="gap-2">
                    <Compass className="h-4 w-4" />
                    Back to discovery
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="secondary" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Open your hub
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card as="section" className="space-y-4 p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <p className="section-eyebrow">Recovery path</p>
              <h2 className="mt-3 text-[30px] font-bold tracking-[-0.04em] text-slate-900">
                Where to go instead
              </h2>
            </div>
            <div className="grid gap-4">
              <Card as="article" className="p-5">
                <p className="text-sm font-semibold text-slate-900">Check discovery</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  See what is currently live and open to offers.
                </p>
              </Card>
              <Card as="article" className="p-5">
                <p className="text-sm font-semibold text-slate-900">Review your dashboard</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Confirm whether the experience moved to a closed or accepted state.
                </p>
              </Card>
              <Card as="article" className="p-5">
                <p className="text-sm font-semibold text-slate-900">Open messages</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  If an offer was accepted, the conversation may already be unlocked there.
                </p>
              </Card>
            </div>
          </Card>
        </section>
      </main>
    </AppShell>
  );
}
