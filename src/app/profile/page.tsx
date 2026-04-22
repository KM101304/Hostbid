import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileForm } from "@/components/profile/profile-form";
import { getAuthenticatedUser, getCurrentProfile } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <ProfileForm profile={profile} />
      </main>
    </AppShell>
  );
}
