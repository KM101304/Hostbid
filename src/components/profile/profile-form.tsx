"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { BadgeCheck, Camera, Sparkles } from "lucide-react";
import { computeProfileQualityScore } from "@/lib/marketplace";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const hasStartedProfile = Boolean(fullName || location || bio || avatarUrl || photoUrls.trim() || age);
  const profileHeading = fullName || (hasStartedProfile ? "Your profile is taking shape" : "Start with a few trust signals");
  const profileMeta = [location || "Add a home base", age ? `Age ${age}` : null].filter(Boolean).join(" · ");
  const profileBadgeLabel = score > 0 ? `Profile ${score}` : "In progress";

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
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card as="section" className="space-y-5 p-6 sm:p-8">
        <div className="space-y-3">
          <Badge tone="primary">
            <Sparkles className="h-3.5 w-3.5" />
            Profile craft
          </Badge>
          <div>
            <h1 className="page-title">Make your presence feel trustworthy before a single message is sent.</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              A complete profile helps hosts understand your style, your consistency, and the kind of experience you value.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input placeholder="Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input placeholder="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Input placeholder="Avatar URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
        <Textarea
          placeholder="Write a calm, specific bio that tells people how you show up."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <Textarea
          placeholder="Photo URLs, one per line"
          value={photoUrls}
          onChange={(e) => setPhotoUrls(e.target.value)}
        />
      </Card>

      <div className="space-y-6">
        <Card as="section" className="space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Avatar
              src={avatarUrl}
              alt={fullName || "Profile"}
              className="h-24 w-24"
              fallback={fullName.slice(0, 1)}
            />
            <div className="min-w-0">
              <p className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">{profileHeading}</p>
              <p className="mt-1 text-sm text-slate-500">{profileMeta}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="info">{profileBadgeLabel}</Badge>
                {isVerified ? (
                  <Badge tone="success">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[linear-gradient(135deg,rgba(249,168,212,0.18),rgba(255,255,255,0.95),rgba(241,245,249,0.92))] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Quality score</p>
            <p className="mt-2 text-[48px] font-bold leading-none tracking-[-0.05em] text-slate-900">{score}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Completeness, verification, and clear personal context help your offers feel more considered.
            </p>
          </div>

          {!hasStartedProfile ? (
            <Card as="div" className="space-y-3 p-4">
              <p className="text-sm font-semibold text-slate-900">A strong starting profile usually includes:</p>
              <div className="space-y-2 text-sm leading-6 text-slate-600">
                <p>1. A recognizable name and location.</p>
                <p>2. A short bio that signals how you show up.</p>
                <p>3. One photo or verification signal that helps offers feel safe.</p>
              </div>
            </Card>
          ) : null}

          <label className="surface-subtle flex items-center justify-between gap-4 px-4 py-4 text-sm font-medium text-slate-800">
            Verification badge
            <input type="checkbox" checked={isVerified} onChange={(e) => setIsVerified(e.target.checked)} />
          </label>

          <Input
            placeholder="Stripe Connect account ID (optional)"
            value={stripeConnectAccountId}
            onChange={(e) => setStripeConnectAccountId(e.target.value)}
          />

          <p className="text-sm leading-7 text-slate-500">
            If you connect Stripe, accepted offers can route automatically with HostBid’s application fee preserved.
          </p>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </Button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </Card>

        {photoUrls.split("\n").filter(Boolean).length > 0 ? (
          <Card as="section" className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-semibold text-slate-700">Photo preview</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                    height={224}
                    className="h-40 w-full rounded-2xl object-cover"
                  />
                ))}
            </div>
          </Card>
        ) : null}
      </div>
    </form>
  );
}
