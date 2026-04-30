"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

declare global {
  interface Window {
    __HOSTBID_ENV__?: {
      NEXT_PUBLIC_APP_URL?: string;
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    };
  }
}

function getBrowserPublicEnv() {
  const runtimeEnv = typeof window !== "undefined" ? window.__HOSTBID_ENV__ : undefined;

  return {
    appUrl: runtimeEnv?.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "",
    googleMapsApiKey:
      runtimeEnv?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    supabaseUrl: runtimeEnv?.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabasePublicKey:
      runtimeEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      "",
  };
}

export function getBrowserAppUrl() {
  return getBrowserPublicEnv().appUrl;
}

export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabasePublicKey } = getBrowserPublicEnv();

  if (!supabaseUrl || !supabasePublicKey) {
    return null;
  }

  return createBrowserClient<Database>(supabaseUrl, supabasePublicKey);
}
