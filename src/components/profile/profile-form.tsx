"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { computeProfileQualityScore } from "@/lib/marketplace";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

type ProfileFormProps = {
  profile: {
    full_name: string | null;
    age: number | null;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;
    photo_urls: string[];
    is_verified: boolean;
    stripe_connect_account_id: string | null;
  } | null;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [age, setAge] = useState(String(profile?.age ?? ""));
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [photoUrls, setPhotoUrls] = useState((profile?.photo_urls ?? []).join("\n"));
  const [isVerified, setIsVerified] = useState(profile?.is_verified ?? false);
  const [stripeConnectAccountId, setStripeConnectAccountId] = useState(
    profile?.stripe_connect_account_id ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const score = useMemo(
    () =>
      computeProfileQualityScore({
        full_name: fullName,
        age: age ? Number(age) : null,
        bio,
        location,
        avatar_url: avatarUrl,
        photo_urls: photoUrls.split("\n").filter(Boolean),
        is_verified: isVerified,
      }),
    [age, avatarUrl, bio, fullName, isVerified, location, photoUrls],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        age,
        bio,
        location,
        avatarUrl,
        photoUrls: photoUrls.split("\n").filter(Boolean),
        isVerified,
        stripeConnectAccountId,
      }),
    });

    const payload = await response.json();

    setSaving(false);
    setMessage(response.ok ? "Profile updated." : payload.error ?? "Unable to update profile.");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-4 rounded-[2rem] border border-stone-200 bg-white p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Profile craft</p>
          <h1 className="font-serif text-4xl text-stone-950">Make your judgment call easy to trust.</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input placeholder="Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input placeholder="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Input placeholder="Avatar URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
        <Textarea placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
        <Textarea
          placeholder="Photo URLs, one per line"
          value={photoUrls}
          onChange={(e) => setPhotoUrls(e.target.value)}
        />
      </section>

      <section className="space-y-4 rounded-[2rem] border border-stone-200 bg-white p-6">
        <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
          <Avatar
            src={avatarUrl}
            alt={fullName || "Profile"}
            className="h-24 w-24"
            fallback={fullName.slice(0, 1)}
          />
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Preview</p>
            <p className="mt-2 text-lg font-semibold text-stone-950">{fullName || "Your name"}</p>
            <p className="mt-1 text-sm text-stone-600">{location || "Add a location"} · Age {age || "--"}</p>
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-stone-950 p-5 text-stone-50">
          <p className="text-sm uppercase tracking-[0.24em] text-stone-400">Quality score</p>
          <p className="mt-2 font-serif text-6xl">{score}</p>
          <p className="mt-3 text-sm text-stone-300">
            Completeness, verification, and clear taste signals raise your selection confidence.
          </p>
        </div>

        <label className="flex items-center justify-between rounded-3xl border border-stone-200 px-4 py-3 text-sm">
          Verification badge
          <input type="checkbox" checked={isVerified} onChange={(e) => setIsVerified(e.target.checked)} />
        </label>

        <Input
          placeholder="Stripe Connect account ID (optional)"
          value={stripeConnectAccountId}
          onChange={(e) => setStripeConnectAccountId(e.target.value)}
        />

        <p className="text-sm text-stone-500">
          If you connect Stripe, winning bids can route automatically with an application fee taken by HostBid.
        </p>

        {photoUrls.split("\n").filter(Boolean).length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {photoUrls
              .split("\n")
              .filter(Boolean)
              .slice(0, 3)
              .map((url) => (
                <Image
                  key={url}
                  src={url}
                  alt="Profile preview"
                  width={320}
                  height={192}
                  className="h-28 w-full rounded-2xl object-cover"
                />
              ))}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
        {message ? <p className="text-sm text-stone-600">{message}</p> : null}
      </section>
    </form>
  );
}
