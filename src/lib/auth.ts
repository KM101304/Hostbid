import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/env";

function getAuthDisplayName(user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>) {
  const metadata = user.user_metadata ?? {};
  const explicitName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : [metadata.given_name, metadata.family_name].filter((value) => typeof value === "string").join(" ");

  return explicitName.trim() || null;
}

function getAuthAvatarUrl(user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>) {
  const metadata = user.user_metadata ?? {};
  const avatar =
    typeof metadata.avatar_url === "string"
      ? metadata.avatar_url
      : typeof metadata.picture === "string"
        ? metadata.picture
        : null;

  return avatar?.trim() || null;
}

export async function getAuthenticatedUser() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function getCurrentProfile() {
  const user = await getAuthenticatedUser();

  return getProfileForUser(user);
}

export async function getProfileForUser(user: Awaited<ReturnType<typeof getAuthenticatedUser>>) {
  if (!user || !hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const authFullName = getAuthDisplayName(user);
  const authAvatarUrl = getAuthAvatarUrl(user);
  const profileNeedsHydration = Boolean(
    authFullName && !data?.full_name || authAvatarUrl && !data?.avatar_url,
  );

  if (profileNeedsHydration) {
    const { data: updatedProfile } = await admin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: data?.full_name ?? authFullName,
          avatar_url: data?.avatar_url ?? authAvatarUrl,
        },
        { onConflict: "id" },
      )
      .select("*")
      .maybeSingle();

    return updatedProfile ?? data;
  }

  return data;
}
