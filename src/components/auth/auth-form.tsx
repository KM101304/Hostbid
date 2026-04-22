"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const response =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          })
        : await supabase.auth.signInWithPassword({
            email,
            password,
          });

    if (response.error) {
      setMessage(response.error.message);
      setLoading(false);
      return;
    }

    router.push(mode === "signup" ? "/profile" : "/");
    router.refresh();
  }

  async function handleGoogle() {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_24px_70px_-32px_rgba(36,27,17,0.35)]">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.24em] text-stone-500">
          {mode === "signup" ? "Join HostBid" : "Welcome back"}
        </p>
        <h1 className="font-serif text-4xl tracking-tight text-stone-950">
          {mode === "signup" ? "Build a profile worth selecting." : "Step back into the marketplace."}
        </h1>
      </div>

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

      {message ? <p className="text-sm text-rose-600">{message}</p> : null}

      <Textarea
        readOnly
        value="Funds are only authorized when you place an offer. The poster still makes the final decision."
        className="min-h-0 border-dashed bg-stone-50 text-stone-600"
      />
    </form>
  );
}
