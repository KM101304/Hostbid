import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ExperienceForm } from "@/components/experiences/experience-form";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function NewExperiencePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-8">
        <ExperienceForm />
      </main>
    </AppShell>
  );
}
