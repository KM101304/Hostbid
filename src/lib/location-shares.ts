import "server-only";

import { randomBytes } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const LOCATION_SHARE_BUCKET = "hostbid-location-shares";

export type LocationShareRecord = {
  id: string;
  token: string;
  userId: string;
  userName: string | null;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastAccuracyMeters: number | null;
  lastSeenAt: string | null;
};

export function createLocationShareToken() {
  return randomBytes(24).toString("base64url");
}

function getSharePath(token: string) {
  return `${token}.json`;
}

async function ensureLocationShareBucket() {
  const admin = createSupabaseAdminClient();
  const { data: buckets, error } = await admin.storage.listBuckets();

  if (error) {
    throw error;
  }

  if (buckets?.some((bucket) => bucket.name === LOCATION_SHARE_BUCKET)) {
    return;
  }

  const { error: createError } = await admin.storage.createBucket(LOCATION_SHARE_BUCKET, {
    public: false,
    fileSizeLimit: 1024 * 64,
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw createError;
  }
}

export async function saveLocationShare(record: LocationShareRecord) {
  await ensureLocationShareBucket();
  const admin = createSupabaseAdminClient();
  const { error } = await admin.storage
    .from(LOCATION_SHARE_BUCKET)
    .upload(getSharePath(record.token), Buffer.from(JSON.stringify(record)), {
      contentType: "application/json",
      upsert: true,
    });

  if (error) {
    throw error;
  }

  return record;
}

export async function getLocationShare(token: string) {
  await ensureLocationShareBucket();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from(LOCATION_SHARE_BUCKET).download(getSharePath(token));

  if (error || !data) {
    return null;
  }

  return JSON.parse(await data.text()) as LocationShareRecord;
}

export function isLocationShareVisible(record: LocationShareRecord) {
  return record.isActive && new Date(record.expiresAt) > new Date();
}
