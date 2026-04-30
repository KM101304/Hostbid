import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/auth";

type DiscoveryExperience = {
  id: string;
  title: string;
  description: string;
  vibe_summary: string | null;
  location: string;
  date_window_start: string | null;
  date_window_end: string | null;
  budget_min_cents: number | null;
  status: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    photo_urls: string[] | null;
    is_verified: boolean;
    location: string | null;
    quality_score: number;
  } | null;
  bids: { id: string; status: string }[] | null;
};

type ThreadListItem = {
  id: string;
  poster_id: string;
  bidder_id: string;
  unlocked_at: string;
  experiences: {
    id: string;
    title: string;
    location: string;
    status: string;
  } | null;
};

type MessageItem = {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  thread_id: string;
};

const DISCOVERY_PAGE_SIZE = 24;
const DASHBOARD_SECTION_SIZE = 12;
const THREAD_LIST_SIZE = 25;
const THREAD_MESSAGE_SIZE = 100;
const EXPERIENCE_BID_SIZE = 50;

export async function getDiscoveryExperiences() {
  if (!hasSupabaseAdminEnv()) {
    return [];
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return [];
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("experiences")
    .select(
      `
        *,
        profiles!experiences_user_id_fkey (
          id,
          full_name,
          avatar_url,
          photo_urls,
          is_verified,
          location,
          quality_score
        ),
        bids!bids_experience_id_fkey (
          id,
          status
        )
      `,
    )
    .eq("status", "open")
    .or("expires_at.is.null,expires_at.gte.now()")
    .order("created_at", { ascending: false })
    .limit(DISCOVERY_PAGE_SIZE);

  return (data ?? []) as unknown as DiscoveryExperience[];
}

export async function getExperienceDetail(experienceId: string) {
  if (!hasSupabaseAdminEnv()) {
    return {
      experience: null,
      bids: [],
    };
  }

  const admin = createSupabaseAdminClient();
  const user = await getAuthenticatedUser();
  const userId = user?.id;

  const { data: experience } = await admin
    .from("experiences")
    .select(
      `
        *,
        profiles!experiences_user_id_fkey (
          id,
          full_name,
          avatar_url,
          bio,
          location,
          quality_score,
          is_verified,
          photo_urls,
          stripe_connect_account_id,
          stripe_charges_enabled,
          stripe_payouts_enabled
        )
      `,
    )
    .eq("id", experienceId)
    .maybeSingle();

  const { data: bids } = await admin
    .from("bids")
    .select(
      `
        *,
        profiles!bids_bidder_id_fkey (
          id,
          full_name,
          avatar_url,
          bio,
          location,
          quality_score,
          is_verified
        )
      `,
    )
    .eq("experience_id", experienceId)
    .in("status", ["active", "selected", "refunded", "capture_failed"])
    .order("amount_cents", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(EXPERIENCE_BID_SIZE);

  const visibleBids =
    userId && experience?.user_id === userId
      ? bids ?? []
      : (bids ?? []).filter((bid) => bid.bidder_id === userId || bid.status === "selected");

  return {
    experience: experience as typeof experience,
    bids: visibleBids as typeof visibleBids,
  };
}

export async function getThreadsForUser(userId: string) {
  if (!hasSupabaseAdminEnv()) {
    return [];
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("threads")
    .select(
      `
        *,
        experiences (
          id,
          title,
          location,
          status
        )
      `,
    )
    .or(`poster_id.eq.${userId},bidder_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(THREAD_LIST_SIZE);

  return (data ?? []) as unknown as ThreadListItem[];
}

export async function getDashboardData(userId: string) {
  if (!hasSupabaseAdminEnv()) {
    return {
      experiences: [],
      bids: [],
    };
  }

  const admin = createSupabaseAdminClient();

  const [{ data: experiences }, { data: bids }] = await Promise.all([
    admin
      .from("experiences")
      .select("*, bids!bids_experience_id_fkey(id, status)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(DASHBOARD_SECTION_SIZE),
    admin
      .from("bids")
      .select(
        `
          *,
          experiences (
            id,
            title,
            location,
            selected_bid_id,
            winner_user_id,
            chat_unlocked_at,
            status
          )
        `,
      )
      .eq("bidder_id", userId)
      .order("created_at", { ascending: false })
      .limit(DASHBOARD_SECTION_SIZE),
  ]);

  return {
    experiences: (experiences ?? []) as unknown as Array<{
      id: string;
      title: string;
      status: string;
      location: string;
      created_at: string;
      selected_bid_id: string | null;
      winner_user_id: string | null;
      bids: { id: string; status: string }[] | null;
    }>,
    bids: (bids ?? []) as unknown as Array<{
      id: string;
      amount_cents: number;
      status: string;
      created_at: string;
      experiences: {
        id: string;
        title: string;
        location: string;
        selected_bid_id: string | null;
        winner_user_id: string | null;
        chat_unlocked_at: string | null;
        status: string;
      } | null;
    }>,
  };
}

export async function getThreadDetail(threadId: string, userId: string) {
  if (!hasSupabaseAdminEnv()) {
    return {
      thread: null,
      messages: [],
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: thread } = await admin
    .from("threads")
    .select(
      `
        *,
        experiences (
          id,
          title,
          location,
          status
        )
      `,
    )
    .eq("id", threadId)
    .or(`poster_id.eq.${userId},bidder_id.eq.${userId}`)
    .maybeSingle();

  const { data: messages } = await admin
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(THREAD_MESSAGE_SIZE);

  return {
    thread: (thread ?? null) as unknown as ThreadListItem | null,
    messages: ((messages ?? []).reverse()) as unknown as MessageItem[],
  };
}
