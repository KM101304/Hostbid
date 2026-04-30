import { KeyRound, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function ResetPasswordPage() {
  return (
    <AppShell>
      <main className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-7xl items-center gap-8 px-5 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-10">
        <section className="space-y-6">
          <Badge tone="primary">Account access</Badge>
          <div className="space-y-4">
            <h1 className="page-title">Recover your account without leaving the HostBid flow.</h1>
            <p className="page-copy max-w-xl">
              Reset emails now use HostBid&apos;s custom email UI through Resend while Supabase still verifies the secure token.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card as="section" className="p-5">
              <KeyRound className="h-5 w-5 text-primary-dark" />
              <p className="mt-4 text-sm font-semibold text-slate-900">Private reset link</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The link signs you into a temporary recovery session so you can choose a new password.
              </p>
            </Card>
            <Card as="section" className="p-5">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="mt-4 text-sm font-semibold text-slate-900">Branded email</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Resend handles delivery, and Supabase handles the actual account verification.
              </p>
            </Card>
          </div>
        </section>
        <ResetPasswordForm />
      </main>
    </AppShell>
  );
}
