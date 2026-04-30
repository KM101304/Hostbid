import { z } from "zod";

const isoDateTimeField = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    if (!value) {
      return "";
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Invalid date.");
    }

    return parsed.toISOString();
  });

export const profileSchema = z.object({
  fullName: z.string().min(2).max(80),
  age: z.coerce.number().int().min(18).max(100),
  bio: z.string().min(20).max(500),
  location: z.string().min(2).max(120),
  locationPlaceId: z.string().min(6, "Select a valid Google Maps address.").max(255),
  locationLatitude: z.number().min(-90).max(90).nullable().optional(),
  locationLongitude: z.number().min(-180).max(180).nullable().optional(),
  locationCity: z.string().max(120).nullable().optional(),
  locationProvince: z.string().max(120).nullable().optional(),
  locationCountry: z.string().max(120).nullable().optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  photoUrls: z.array(z.string().url()).max(6).default([]),
  stripeConnectAccountId: z.string().optional().or(z.literal("")),
});

export const experienceSchema = z.object({
  title: z.string().min(4).max(120),
  description: z.string().min(30).max(1500),
  location: z.string().min(2).max(160),
  locationPlaceId: z.string().min(6, "Select a valid Google Maps address.").max(255),
  locationLatitude: z.number().min(-90).max(90).nullable().optional(),
  locationLongitude: z.number().min(-180).max(180).nullable().optional(),
  locationCity: z.string().max(120).nullable().optional(),
  locationProvince: z.string().max(120).nullable().optional(),
  locationCountry: z.string().max(120).nullable().optional(),
  vibeSummary: z.string().min(6).max(160),
  dateWindowStart: isoDateTimeField,
  dateWindowEnd: isoDateTimeField,
  startingBidCents: z.coerce.number().int().min(1000).optional(),
  expiresAt: isoDateTimeField,
  safetyPreferences: z.array(z.string()).default([]),
}).superRefine((value, ctx) => {
  const start = value.dateWindowStart ? new Date(value.dateWindowStart) : null;
  const end = value.dateWindowEnd ? new Date(value.dateWindowEnd) : null;
  const expiresAt = value.expiresAt ? new Date(value.expiresAt) : null;

  if (start && end && end <= start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dateWindowEnd"],
      message: "End time must be after the start time.",
    });
  }

  if (expiresAt && start && expiresAt >= start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expiresAt"],
      message: "Offer deadline should be before the experience starts.",
    });
  }

  if (expiresAt && expiresAt <= new Date()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expiresAt"],
      message: "Offer deadline needs to be in the future.",
    });
  }
});

export const bidIntentSchema = z.object({
  amountCents: z.coerce.number().int().min(1000).max(1000000),
  pitch: z.string().min(12).max(280),
  paymentIntentId: z.string().optional(),
  paymentMode: z.enum(["secured", "unsecured"]).optional(),
});

export const locationShareSchema = z.object({
  durationMinutes: z.coerce.number().int().min(15).max(240).default(120),
});

export const locationUpdateSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  accuracyMeters: z.coerce.number().min(0).max(100000).optional(),
});

export const messageSchema = z.object({
  body: z.string().min(1).max(1200),
});

export const reportSchema = z.object({
  reason: z.string().min(3).max(120),
  details: z.string().max(1200).optional(),
  reportedUserId: z.string().uuid().optional(),
  experienceId: z.string().uuid().optional(),
  bidId: z.string().uuid().optional(),
});
