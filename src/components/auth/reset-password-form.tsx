"use client";

import { useEffect, useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getFriendlyAuthError } from "@/lib/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success">("success");

  useEffect(() => {
    async function checkSession() {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        setCheckingSession(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setHasRecoverySession(Boolean(session));
      setCheckingSession(false);
    }

    void checkSession();
  }, []);

  function showMessage(text: string, tone: "error" | "success" = "success") {
    setMessage(text);
    setMessageTone(tone);
  }

  async function requestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const payload = await response.json();

    setLoading(false);

    if (!response.ok) {
      showMessage(payload.error ?? "Unable to send a reset email.", "error");
      return;
    }

    showMessage(payload.message ?? "If that account exists, a HostBid reset link is on the way.");
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      showMessage("Password must be at least 8 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords need to match.", "error");
      return;
    }

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      showMessage("Authentication is not configured yet.", "error");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      showMessage(getFriendlyAuthError(error.message, "Unable to update your password. Please try the reset link again."), "error");
      return;
    }

    showMessage("Password updated. Taking you back to your profile.");
    window.setTimeout(() => window.location.assign("/profile"), 900);
  }

  return (
    <Card as="section" className="fade-slide space-y-6 p-8 sm:p-10">
      <div className="space-y-3">
        <Badge tone="primary">
          {hasRecoverySession ? <KeyRound className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
          Password reset
        </Badge>
        <div className="space-y-2">
          <p className="page-title text-[36px] sm:text-[48px]">
            {hasRecoverySession ? "Choose a new password." : "Get a secure reset link."}
          </p>
          <p className="text-base leading-7 text-slate-600">
            {hasRecoverySession
              ? "Use a password you do not use anywhere else on HostBid."
              : "We will send a branded HostBid reset email if the account exists."}
          </p>
        </div>
      </div>

      {checkingSession ? (
        <p className="text-sm text-slate-600">Checking your reset session...</p>
      ) : hasRecoverySession ? (
        <form onSubmit={updatePassword} className="space-y-4">
          <Input
            aria-label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
          <Input
            aria-label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      ) : (
        <form onSubmit={requestReset} className="space-y-4">
          <Input
            aria-label="Email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}

      {message ? (
        <p className={messageTone === "error" ? "text-sm text-red-600" : "text-sm text-emerald-700"}>
          {message}
        </p>
      ) : null}
    </Card>
  );
}
