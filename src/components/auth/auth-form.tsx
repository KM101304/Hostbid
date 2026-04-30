"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient, getBrowserAppUrl } from "@/lib/supabase/browser";
import { getFriendlyAuthError } from "@/lib/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthMode = "login" | "signup";

export function AuthForm({ mode, initialMessage = null }: { mode: AuthMode; initialMessage?: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(initialMessage);

  function getAuthRedirectUrl(next = "/") {
    const appUrl = getBrowserAppUrl().trim();
    const origin = window.location.origin || (appUrl && appUrl.length > 0 ? appUrl.replace(/\/$/, "") : "");
    return `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();

    if (!supabase && mode === "login") {
      setMessage("Authentication is not configured yet.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Unable to create your account.");
        setLoading(false);
        return;
      }

      setMessage(payload.message ?? "Check your email to confirm your account, then come back here to log in.");
      setLoading(false);
      return;
    }

    const response = await supabase!.auth.signInWithPassword({
      email,
      password,
    });

    if (response.error) {
      setMessage(getFriendlyAuthError(response.error.message, "Unable to log in. Please try again."));
      setLoading(false);
      return;
    }

    await supabase!.auth.getSession();
    window.location.assign("/");
  }

  async function handleGoogle() {
    setLoading(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setMessage("Authentication is not configured yet.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl("/"),
      },
    });

    if (error) {
      setMessage(getFriendlyAuthError(error.message, "Unable to continue with Google. Please try again."));
      setLoading(false);
    }
  }

  return (
    <Card as="section" className="fade-slide space-y-6 p-8 sm:p-10">
      <div className="space-y-3">
        <Badge tone="primary">
          <Sparkles className="h-3.5 w-3.5" />
          {mode === "signup" ? "Join the community" : "Member access"}
        </Badge>
        <div className="space-y-2">
          <p className="page-title text-[36px] sm:text-[48px]">
            {mode === "signup" ? "Create a profile people feel good choosing." : "Return to your experience circle."}
          </p>
          <p className="text-base leading-7 text-slate-600">
            {mode === "signup"
              ? "Share who you are, what kind of moments you enjoy hosting, and the signals that build trust."
              : "Manage experiences, review offers with context, and pick up conversations once a match is accepted."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" ? (
          <Input
            aria-label="Full name"
            placeholder="Full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        ) : null}

        <Input
          aria-label="Email"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <Input
          aria-label="Password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
        </Button>

        {mode === "login" ? (
          <div className="text-right">
            <Link href="/reset-password" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Forgot password?
            </Link>
          </div>
        ) : null}

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleGoogle}
          disabled={loading}
        >
          Continue with Google
        </Button>

        {message ? <p className="text-sm text-red-500">{message}</p> : null}
      </form>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        Offers are only authorized when submitted. Funds are captured only after host acceptance and bidder confirmation.
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone="success">
          <ShieldCheck className="h-3.5 w-3.5" />
          Trust-first onboarding
        </Badge>
        <Badge tone="info">Profile quality signals</Badge>
      </div>
    </Card>
  );
}
