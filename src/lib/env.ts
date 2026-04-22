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

export function hasSupabaseEnv() {
  return hasEnv("NEXT_PUBLIC_SUPABASE_URL") && hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function hasSupabaseAdminEnv() {
  return hasSupabaseEnv() && hasEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function getPlatformFeePercent() {
  return Number(process.env.HOSTBID_PLATFORM_FEE_PERCENT ?? "15");
}
