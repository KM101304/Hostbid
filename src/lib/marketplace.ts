import { differenceInHours, isAfter } from "date-fns";
import type { Database } from "@/lib/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ExperienceRow = Database["public"]["Tables"]["experiences"]["Row"];

export function computeProfileQualityScore(profile: Partial<ProfileRow>) {
  let score = 20;

  if (profile.full_name) score += 20;
  if (profile.age) score += 15;
  if (profile.bio && profile.bio.length > 60) score += 15;
  if (profile.location) score += 10;
  if (profile.avatar_url) score += 10;
  if (profile.photo_urls && profile.photo_urls.length >= 2) score += 10;

  return Math.min(score, 100);
}

export function experienceIsInactive(experience: ExperienceRow) {
  if (!experience.expires_at) {
    return false;
  }

  return isAfter(new Date(), new Date(experience.expires_at));
}

export function canCancelAwardedExperience(experience: ExperienceRow) {
  if (!experience.chat_unlocked_at) {
    return false;
  }

  return differenceInHours(new Date(), new Date(experience.chat_unlocked_at)) <= 48;
}
