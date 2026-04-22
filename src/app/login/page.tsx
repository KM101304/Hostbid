import { AppShell } from "@/components/layout/app-shell";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <AppShell>
      <main className="mx-auto grid min-h-[calc(100vh-80px)] w-full max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <section className="space-y-5">
          <p className="text-sm uppercase tracking-[0.28em] text-stone-500">Member access</p>
          <h1 className="font-serif text-6xl leading-none text-stone-950">Return to the offers, not the noise.</h1>
          <p className="max-w-xl text-lg leading-8 text-stone-600">
            HostBid is designed for deliberate, high-intent planning. Log in to manage experiences, offers, and post-selection chats.
          </p>
        </section>
        <AuthForm mode="login" />
      </main>
    </AppShell>
  );
}
