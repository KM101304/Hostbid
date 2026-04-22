import { AppShell } from "@/components/layout/app-shell";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <AppShell>
      <main className="mx-auto grid min-h-[calc(100vh-80px)] w-full max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <section className="space-y-5">
          <p className="text-sm uppercase tracking-[0.28em] text-stone-500">Account creation</p>
          <h1 className="font-serif text-6xl leading-none text-stone-950">Join a marketplace built around plans with intention.</h1>
          <p className="max-w-xl text-lg leading-8 text-stone-600">
            Build a strong profile, post experiences, or compete to host them with secure payment authorization and clear boundaries.
          </p>
        </section>
        <AuthForm mode="signup" />
      </main>
    </AppShell>
  );
}
