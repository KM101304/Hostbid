import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(2).max(80),
  age: z.coerce.number().int().min(18).max(100),
  bio: z.string().min(20).max(500),
  location: z.string().min(2).max(120),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  photoUrls: z.array(z.string().url()).max(6).default([]),
  isVerified: z.boolean().default(false),
  stripeConnectAccountId: z.string().optional().or(z.literal("")),
});

export const experienceSchema = z.object({
  title: z.string().min(4).max(120),
  description: z.string().min(30).max(1500),
  location: z.string().min(2).max(160),
  vibeSummary: z.string().min(6).max(160),
  dateWindowStart: z.string().datetime().optional().or(z.literal("")),
  dateWindowEnd: z.string().datetime().optional().or(z.literal("")),
  budgetMinCents: z.coerce.number().int().min(0).optional(),
  budgetMaxCents: z.coerce.number().int().min(0).optional(),
  expiresAt: z.string().datetime().optional().or(z.literal("")),
  safetyPreferences: z.array(z.string()).default([]),
});

export const bidIntentSchema = z.object({
  amountCents: z.coerce.number().int().min(1000).max(1000000),
  pitch: z.string().min(12).max(280),
  paymentIntentId: z.string().optional(),
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
