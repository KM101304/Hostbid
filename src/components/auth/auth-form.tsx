"use client";

import { useState } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient, getBrowserAppUrl } from "@/lib/supabase/browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";

type AuthMode = "login" | "signup";

export function AuthForm({ mode, initialMessage = null }: { mode: AuthMode; initialMessage?: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(initialMessage);

  function getAuthRedirectUrl(next = "/") {
    const appUrl = getBrowserAppUrl().trim();
    const origin = appUrl && appUrl.length > 0 ? appUrl.replace(/\/$/, "") : window.location.origin;
    return `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`;
  }

  function getEmailConfirmationRedirectUrl() {
    const appUrl = getBrowserAppUrl().trim();
    const origin = appUrl && appUrl.length > 0 ? appUrl.replace(/\/$/, "") : window.location.origin;
    return `${origin}/login?confirmed=1`;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setMessage("Authentication is not configured yet.");
      setLoading(false);
      return;
    }

    const response =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
              emailRedirectTo: getEmailConfirmationRedirectUrl(),
            },
          })
        : await supabase.auth.signInWithPassword({
            email,
            password,
          });

    if (response.error) {
      setMessage(
        response.error.message === "Email not confirmed"
          ? "Confirm your email from the message we sent, then come back and log in."
          : response.error.message,
      );
      setLoading(false);
      return;
    }

    if (mode === "signup" && !response.data.session) {
      setMessage("Check your email to confirm your account, then come back here to log in.");
      setLoading(false);
      return;
    }

    await supabase.auth.getSession();
    window.location.assign(mode === "signup" ? "/profile" : "/");
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
      setMessage(error.message);
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
            placeholder="Full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        ) : null}

        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
        </Button>

        <Button type="button" variant="secondary" className="w-full" onClick={handleGoogle} disabled={loading}>
          Continue with Google
        </Button>

        {message ? <p className="text-sm text-red-500">{message}</p> : null}
      </form>

      <Textarea
        readOnly
        value="Offers are only authorized when submitted. Funds are captured only if the experience host accepts."
        className="min-h-0 resize-none border-dashed bg-slate-50 text-slate-600"
      />

      <div className="flex flex-wrap gap-2">
        <Badge tone="success">
          <ShieldCheck className="h-3.5 w-3.5" />
          Trust-first onboarding
        </Badge>
        <Badge tone="info">Soft verification signals</Badge>
      </div>
    </Card>
  );
}
