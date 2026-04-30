"use client";
import { useEffect, useMemo, useState } from "react";
import { Camera, ExternalLink, ScanFace, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { computeProfileQualityScore } from "@/lib/marketplace";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { PhotoUrlField } from "@/components/profile/photo-url-field";
import { RemoteImage } from "@/components/ui/remote-image";
import { formatCurrency } from "@/lib/utils";
import { LocationShareCard } from "@/components/safety/location-share-card";
import { GooglePlacesField } from "@/components/location/google-places-field";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";

type ProfileFormProps = {
  profile: {
    full_name: string | null;
    age: number | null;
    bio: string | null;
    location: string | null;
    location_place_id?: string | null;
    location_latitude?: number | null;
    location_longitude?: number | null;
    location_city?: string | null;
    location_province?: string | null;
    location_country?: string | null;
    avatar_url: string | null;
    photo_urls: string[];
    stripe_connect_account_id: string | null;
    is_verified?: boolean | null;
    verification_status?: string | null;
  } | null;
};

type StripeConnectState = {
  accountId?: string | null;
  connected: boolean;
  onboardingComplete: boolean;
  payoutsEnabled: boolean;
  chargesEnabled?: boolean;
  balanceAvailableCents?: number;
  balancePendingCents?: number;
};

type ToastState = {
  message: string;
  tone: "error" | "success" | "info";
} | null;

const VERIFICATION_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VERIFICATION_MAX_SIZE_BYTES = 8 * 1024 * 1024;

function getInitialStripeMessage() {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const stripeParam = params.get("stripe");

  if (stripeParam === "connected") {
    return "Stripe setup completed. Your payouts can now flow automatically when you accept a winning bid.";
  }

  if (stripeParam === "refresh") {
    return "Stripe setup was refreshed. Finish the remaining steps to enable payouts.";
  }

  return null;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [age, setAge] = useState(String(profile?.age ?? ""));
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [locationPlaceId, setLocationPlaceId] = useState(profile?.location_place_id ?? "");
  const [locationLatitude, setLocationLatitude] = useState<number | null>(profile?.location_latitude ?? null);
  const [locationLongitude, setLocationLongitude] = useState<number | null>(profile?.location_longitude ?? null);
  const [locationCity, setLocationCity] = useState<string | null>(profile?.location_city ?? null);
  const [locationProvince, setLocationProvince] = useState<string | null>(profile?.location_province ?? null);
  const [locationCountry, setLocationCountry] = useState<string | null>(profile?.location_country ?? null);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [photoUrls, setPhotoUrls] = useState(profile?.photo_urls ?? []);
  const [verificationStatus, setVerificationStatus] = useState(
    profile?.verification_status ?? (profile?.is_verified ? "verified" : "not_started"),
  );
  const [stripeConnectAccountId, setStripeConnectAccountId] = useState(
    profile?.stripe_connect_account_id ?? "",
  );
  const [toast, setToast] = useState<ToastState>(null);
  const [stripeMessage, setStripeMessage] = useState<string | null>(() => getInitialStripeMessage());
  const [saving, setSaving] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [startingIdentity, setStartingIdentity] = useState(false);
  const [identityDialogOpen, setIdentityDialogOpen] = useState(false);
  const [identitySelfie, setIdentitySelfie] = useState<File | null>(null);
  const [stripeState, setStripeState] = useState<StripeConnectState>({
    accountId: profile?.stripe_connect_account_id ?? null,
    connected: Boolean(profile?.stripe_connect_account_id),
    onboardingComplete: false,
    payoutsEnabled: false,
  });
  const leadPhotoUrl = photoUrls[0] || avatarUrl;
  const currentProfileSnapshot = useMemo(
    () =>
      JSON.stringify({
        fullName,
        age,
        bio,
        location,
        locationPlaceId,
        locationLatitude,
        locationLongitude,
        locationCity,
        locationProvince,
        locationCountry,
        leadPhotoUrl,
        photoUrls,
      }),
    [
      age,
      bio,
      fullName,
      leadPhotoUrl,
      location,
      locationCity,
      locationCountry,
      locationLatitude,
      locationLongitude,
      locationPlaceId,
      locationProvince,
      photoUrls,
    ],
  );
  const [savedProfileSnapshot, setSavedProfileSnapshot] = useState(currentProfileSnapshot);
  const hasUnsavedChanges = currentProfileSnapshot !== savedProfileSnapshot;

  useUnsavedChangesWarning(hasUnsavedChanges && !saving);

  const score = useMemo(
    () =>
      computeProfileQualityScore({
        full_name: fullName,
        age: age ? Number(age) : null,
        bio,
        location,
        avatar_url: leadPhotoUrl,
        photo_urls: photoUrls,
        is_verified: verificationStatus === "verified",
        verification_status: verificationStatus,
      }),
    [age, bio, fullName, leadPhotoUrl, location, photoUrls, verificationStatus],
  );
  const hasStartedProfile = Boolean(fullName || location || bio || leadPhotoUrl || photoUrls.length || age);
  const profileHeading = fullName || (hasStartedProfile ? "Your profile is taking shape" : "Start with a few trust signals");
  const profileMeta = [location || "Add a home base", age ? `Age ${age}` : null].filter(Boolean).join(" · ");
  const profileBadgeLabel = score > 0 ? `Profile ${score}` : "In progress";

  useEffect(() => {
    async function fetchStripeStatus() {
      const response = await fetch("/api/stripe/connect");
      const payload = await response.json();

      if (!response.ok) {
        setStripeMessage(payload.error ?? "Unable to load Stripe payout status.");
        return;
      }

      setStripeState({
        accountId: payload.accountId,
        connected: payload.connected,
        onboardingComplete: payload.onboardingComplete,
        payoutsEnabled: payload.payoutsEnabled,
        chargesEnabled: payload.chargesEnabled,
        balanceAvailableCents: payload.balanceAvailableCents,
        balancePendingCents: payload.balancePendingCents,
      });
      setStripeConnectAccountId(payload.accountId ?? "");
    }

    void fetchStripeStatus();

    async function syncIdentityStatus() {
      const params = new URLSearchParams(window.location.search);

      if (params.get("identity") !== "return") {
        return;
      }

      const response = await fetch("/api/identity/verification");
      const payload = await response.json();

      if (response.ok && payload.profile?.is_verified) {
        setVerificationStatus("verified");
      } else if (response.ok) {
        setVerificationStatus("pending");
      }
    }

    void syncIdentityStatus();
  }, []);

  function showToast(message: string, tone: "error" | "success" | "info" = "info") {
    setToast({ message, tone });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setToast(null);

    if (location && !locationPlaceId) {
      setSaving(false);
      showToast("Choose an address from the Google suggestions before saving.", "error");
      return;
    }

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
        locationPlaceId,
        locationLatitude,
        locationLongitude,
        locationCity,
        locationProvince,
        locationCountry,
        avatarUrl: leadPhotoUrl,
        photoUrls,
        stripeConnectAccountId,
      }),
    });

    const payload = await response.json();

    setSaving(false);

    if (response.ok) {
      setSavedProfileSnapshot(currentProfileSnapshot);
      showToast("Profile updated.", "success");
      return;
    }

    showToast(payload.error ?? "Unable to update profile.", "error");
  }

  async function handleStripeConnect() {
    setConnectingStripe(true);
    setStripeMessage(null);

    const response = await fetch("/api/stripe/connect", {
      method: "POST",
    });
    const payload = await response.json();

    if (!response.ok) {
      setConnectingStripe(false);
      setStripeMessage(payload.error ?? "Unable to start Stripe onboarding.");
      return;
    }

    setStripeConnectAccountId(payload.accountId ?? "");

    window.location.assign(payload.url);
  }

  const stripeStatusLabel = !stripeState.connected
    ? "Not connected"
    : stripeState.payoutsEnabled
      ? "Payouts enabled"
      : stripeState.onboardingComplete
        ? "Almost ready"
        : "Setup in progress";
  const stripeButtonLabel = !stripeState.connected
    ? "Connect Stripe payouts"
    : stripeState.payoutsEnabled
      ? "Open Stripe dashboard"
      : "Continue Stripe setup";

  async function startIdentityVerification() {
    if (verificationStatus === "verified") {
      showToast("Your identity is already verified.", "success");
      return;
    }

    setIdentityDialogOpen(true);
  }

  async function submitIdentityVerification() {
    if (!identitySelfie) {
      showToast("Upload a PNG, JPG, or WEBP selfie before submitting.", "error");
      return;
    }

    if (!VERIFICATION_ALLOWED_TYPES.has(identitySelfie.type)) {
      showToast("Unsupported file type. Please upload PNG, JPG, JPEG, or WEBP.", "error");
      return;
    }

    if (identitySelfie.size > VERIFICATION_MAX_SIZE_BYTES) {
      showToast("Keep the verification image under 8 MB.", "error");
      return;
    }

    setStartingIdentity(true);
    setToast(null);

    const formData = new FormData();
    formData.append("selfie", identitySelfie);

    const response = await fetch("/api/identity/verification", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();

    setStartingIdentity(false);

    if (!response.ok) {
      showToast(payload.error ?? "Unable to submit identity verification.", "error");
      return;
    }

    setVerificationStatus(payload.profile?.verification_status ?? "pending");
    setIdentitySelfie(null);
    setIdentityDialogOpen(false);
    showToast("Verification submitted for review.", "success");
  }

  const verificationStatusLabel =
    verificationStatus === "verified"
      ? "ID + face verified"
      : verificationStatus === "pending"
        ? "Review pending"
        : verificationStatus === "rejected"
          ? "Needs retry"
          : "Not started";

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
          <Input aria-label="Name" placeholder="Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input aria-label="Age" placeholder="Age" type="number" min="18" max="100" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} required />
        </div>
        <GooglePlacesField
          label="Location"
          placeholder="Start typing an address"
          value={location}
          placeId={locationPlaceId}
          latitude={locationLatitude}
          longitude={locationLongitude}
          required
          onChange={(selection) => {
            setLocation(selection.address);
            setLocationPlaceId(selection.placeId);
            setLocationLatitude(selection.latitude);
            setLocationLongitude(selection.longitude);
            setLocationCity(selection.city);
            setLocationProvince(selection.province);
            setLocationCountry(selection.country);
          }}
        />
        <Textarea
          aria-label="Bio"
          placeholder="Write a calm, specific bio that tells people how you show up."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          required
          minLength={20}
        />
        <p className="text-sm leading-6 text-slate-500">Bio must be at least 20 characters.</p>
        <PhotoUrlField
          urls={photoUrls}
          onChange={setPhotoUrls}
          onPrimaryChange={(url) => {
            if (url) {
              setAvatarUrl(url);
            }
          }}
        />
        <p className="text-sm leading-6 text-slate-500">
          Your first photo becomes your main profile image across offers, chat, and feed cards.
        </p>
      </Card>

      <div className="space-y-6">
        <Card as="section" className="space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Avatar
              src={leadPhotoUrl}
              alt={fullName || "Profile"}
              className="h-24 w-24"
              fallback={fullName.slice(0, 1)}
            />
            <div className="min-w-0">
              <p className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">{profileHeading}</p>
              <p className="mt-1 text-sm text-slate-500">{profileMeta}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="info">{profileBadgeLabel}</Badge>
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
          <Card as="section" className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ScanFace className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-slate-900">ID + face verification</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Submit a current selfie for manual review. The trust badge appears only after the verification is approved.
                </p>
              </div>
              <Badge tone={verificationStatus === "verified" ? "success" : verificationStatus === "pending" ? "info" : "default"}>
                {verificationStatusLabel}
              </Badge>
            </div>
            <Button
              type="button"
              variant={verificationStatus === "verified" ? "secondary" : "primary"}
              className="w-full gap-2"
              onClick={startIdentityVerification}
              disabled={startingIdentity || verificationStatus === "verified"}
            >
              <ScanFace className="h-4 w-4" />
              {startingIdentity
                ? "Submitting..."
                : verificationStatus === "verified"
                  ? "Verified"
                  : verificationStatus === "pending"
                    ? "Update verification submission"
                    : "Submit verification"}
            </Button>
          </Card>

          <LocationShareCard />

          <Card as="section" className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-slate-900">Stripe payouts</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Connect Stripe once so accepted bids can route to you automatically and HostBid can keep the platform fee. You do not need an existing Stripe dashboard account first.
                </p>
              </div>
              <Badge tone={stripeState.payoutsEnabled ? "success" : stripeState.connected ? "info" : "default"}>
                {stripeStatusLabel}
              </Badge>
            </div>

            <div className="rounded-2xl bg-slate-50/90 p-4 text-sm leading-6 text-slate-600">
              {!stripeState.connected
                ? "You have not connected payouts yet. When HostBid payouts are enabled, this button will walk you through Stripe's setup flow and create the payout account for you."
                : stripeState.payoutsEnabled
                  ? "Your payout route is ready. When you accept a winning bid, Stripe can route the funds to you with the HostBid fee preserved."
                  : "Your Stripe account exists, but there are still onboarding steps left before payouts are fully enabled."}
            </div>

            <Button
              type="button"
              variant={stripeState.payoutsEnabled ? "secondary" : "primary"}
              className="w-full gap-2"
              onClick={handleStripeConnect}
              disabled={connectingStripe}
            >
              {connectingStripe ? "Opening Stripe..." : stripeButtonLabel}
              <ExternalLink className="h-4 w-4" />
            </Button>

            {stripeMessage ? <p className="text-sm text-slate-600">{stripeMessage}</p> : null}
          </Card>

          <Card as="section" className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <WalletCards className="h-4 w-4 text-sky-600" />
              <p className="text-sm font-semibold text-slate-900">Payout balances</p>
            </div>

            {stripeState.connected ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Available</p>
                  <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-slate-900">
                    {formatCurrency(stripeState.balanceAvailableCents ?? 0)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Ready for Stripe to include in the next payout cycle.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pending</p>
                  <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-slate-900">
                    {formatCurrency(stripeState.balancePendingCents ?? 0)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Authorized or recently captured funds still moving through settlement.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50/90 p-4 text-sm leading-6 text-slate-600">
                Connect Stripe payouts first and this section will start showing your available and pending balances automatically.
              </div>
            )}
          </Card>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </Card>

        {photoUrls.length > 0 ? (
          <Card as="section" className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-semibold text-slate-700">Photo preview</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {photoUrls.slice(0, 3).map((url) => (
                <RemoteImage
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
      {toast ? (
        <div
          className={[
            "fixed right-4 top-[calc(5rem+env(safe-area-inset-top))] z-50 max-w-sm rounded-2xl border bg-white p-4 text-sm leading-6 shadow-soft-lg",
            toast.tone === "error"
              ? "border-red-200 text-red-700"
              : toast.tone === "success"
                ? "border-emerald-200 text-emerald-700"
                : "border-slate-200 text-slate-700",
          ].join(" ")}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}
      {identityDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Submit facial verification"
        >
          <Card as="section" className="w-full max-w-lg space-y-5 p-6 sm:p-8">
            <div>
              <Badge tone="primary">
                <ScanFace className="h-3.5 w-3.5" />
                Facial verification
              </Badge>
              <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.04em] text-slate-900">
                Submit a selfie for review
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use a clear, current photo of your face. Files are stored privately in Supabase while the review is pending.
              </p>
            </div>
            <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 text-sm leading-6 text-slate-600">
              <span className="font-semibold text-slate-900">Selfie image</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="mt-3 block w-full text-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;

                  if (file && !VERIFICATION_ALLOWED_TYPES.has(file.type)) {
                    showToast("Unsupported file type. Please upload PNG, JPG, JPEG, or WEBP.", "error");
                    event.currentTarget.value = "";
                    setIdentitySelfie(null);
                    return;
                  }

                  setIdentitySelfie(file);
                }}
              />
              <span className="mt-2 block text-xs text-slate-500">PNG, JPG, or WEBP. Maximum 8 MB.</span>
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setIdentityDialogOpen(false);
                  setIdentitySelfie(null);
                }}
                disabled={startingIdentity}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => void submitIdentityVerification()}
                disabled={startingIdentity}
              >
                {startingIdentity ? "Submitting..." : "Submit for review"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </form>
  );
}
