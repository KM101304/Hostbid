import "server-only";

import type Stripe from "stripe";
import type { Database } from "@/lib/database.types";
import { computeProfileQualityScore } from "@/lib/marketplace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export const IDENTITY_VERIFICATION_BUCKET = "identity-verification-submissions";

const IDENTITY_ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function getVerificationStatusFromStripeSession(session: Stripe.Identity.VerificationSession) {
  if (session.status === "verified") {
    return "verified";
  }

  if (session.status === "requires_input" || session.status === "canceled") {
    return "rejected";
  }

  return "pending";
}

export function computeNextVerificationScore(profile: Partial<ProfileRow>, verificationStatus: string) {
  return computeProfileQualityScore({
    ...profile,
    is_verified: verificationStatus === "verified",
    verification_status: verificationStatus,
  });
}

export async function syncStripeIdentitySession(session: Stripe.Identity.VerificationSession) {
  const profileId = session.metadata.userId || session.client_reference_id;

  if (!profileId) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", profileId).maybeSingle();
  const verificationStatus = getVerificationStatusFromStripeSession(session);
  const update: ProfileUpdate = {
    is_verified: verificationStatus === "verified",
    quality_score: computeNextVerificationScore(profile ?? { id: profileId }, verificationStatus),
  };

  const { data } = await admin
    .from("profiles")
    .update(update)
    .eq("id", profileId)
    .select("*")
    .maybeSingle();

  return data;
}

async function ensureIdentityVerificationBucket() {
  const admin = createSupabaseAdminClient();
  const { data: buckets, error } = await admin.storage.listBuckets();

  if (error) {
    throw error;
  }

  if (buckets?.some((bucket) => bucket.name === IDENTITY_VERIFICATION_BUCKET)) {
    return;
  }

  const { error: createError } = await admin.storage.createBucket(IDENTITY_VERIFICATION_BUCKET, {
    public: false,
    fileSizeLimit: 8 * 1024 * 1024,
    allowedMimeTypes: Array.from(IDENTITY_ALLOWED_IMAGE_TYPES),
  });

  if (createError) {
    throw createError;
  }
}

function sanitizeFileName(fileName: string) {
  return (
    fileName
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "selfie.jpg"
  );
}

export function validateIdentitySelfie(file: File) {
  if (!IDENTITY_ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Upload a PNG, JPG, JPEG, or WEBP selfie.");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Keep the selfie under 8 MB.");
  }
}

export async function uploadIdentitySelfie(userId: string, file: File) {
  validateIdentitySelfie(file);
  await ensureIdentityVerificationBucket();

  const admin = createSupabaseAdminClient();
  const objectPath = `${userId}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error } = await admin.storage
    .from(IDENTITY_VERIFICATION_BUCKET)
    .upload(objectPath, Buffer.from(await file.arrayBuffer()), {
      cacheControl: "300",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return `${IDENTITY_VERIFICATION_BUCKET}/${objectPath}`;
}
