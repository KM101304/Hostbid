import { ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <AppShell>
      <main className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-7xl items-center gap-8 px-5 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-10">
        <section className="space-y-6">
          <Badge tone="primary">Create your account</Badge>
          <div className="space-y-4">
            <h1 className="page-title">Join a platform designed around trust, tone, and better experiences.</h1>
            <p className="page-copy max-w-xl">
              Build a profile that feels complete, create experiences with clear boundaries, or submit thoughtful offers that stand out for the right reasons.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card as="section" className="p-5">
              <Sparkles className="h-5 w-5 text-primary-dark" />
              <p className="mt-4 text-sm font-semibold text-slate-900">Meaningful discovery</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Experiences are framed as invitations, with soft hierarchy and strong context.
              </p>
            </Card>
            <Card as="section" className="p-5">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="mt-4 text-sm font-semibold text-slate-900">Trust indicators</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Verification badges, safety tags, and profile quality help people decide with confidence.
              </p>
            </Card>
          </div>
        </section>
        <AuthForm mode="signup" />
      </main>
    </AppShell>
  );
}
