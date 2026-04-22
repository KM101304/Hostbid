export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function hasEnv(name: string) {
  const value = process.env[name];
  return Boolean(value && value.trim().length > 0);
}

export function getSupabasePublicKey() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const value = anonKey || publishableKey;

  if (!value) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return value;
}

export function hasSupabaseEnv() {
  return hasEnv("NEXT_PUBLIC_SUPABASE_URL") && (
    hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || hasEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  );
}

export function hasSupabaseAdminEnv() {
  return hasSupabaseEnv() && hasEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function getAppUrl() {
  return getRequiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
}

export function getPlatformFeePercent() {
  return Number(process.env.HOSTBID_PLATFORM_FEE_PERCENT ?? "15");
}
