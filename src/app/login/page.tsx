import { HeartHandshake, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AppShell>
      <main className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-7xl items-center gap-8 px-5 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-10">
        <section className="space-y-6">
          <Badge tone="primary">Welcome back</Badge>
          <div className="space-y-4">
            <h1 className="page-title">Step back into a calmer way to discover and connect.</h1>
            <p className="page-copy max-w-xl">
              Return to your experiences, review offers with more context, and continue conversations after acceptance.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card as="section" className="p-5">
              <HeartHandshake className="h-5 w-5 text-primary-dark" />
              <p className="mt-4 text-sm font-semibold text-slate-900">Social-first flow</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                People connect around the quality of the experience, not around pressure.
              </p>
            </Card>
            <Card as="section" className="p-5">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="mt-4 text-sm font-semibold text-slate-900">Protected offers</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Authorization happens securely, with capture only after a host accepts.
              </p>
            </Card>
          </div>
        </section>
        <AuthForm mode="login" initialMessage={error ?? null} />
      </main>
    </AppShell>
  );
}
