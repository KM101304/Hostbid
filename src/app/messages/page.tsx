import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getAuthenticatedUser } from "@/lib/auth";
import { getThreadsForUser } from "@/lib/queries";

export default async function MessagesPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const threads = await getThreadsForUser(user.id);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-5xl px-5 py-10 lg:px-8">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Unlocked chats</p>
          <h1 className="mt-3 font-serif text-5xl text-stone-950">Selected pair conversations</h1>
          <div className="mt-6 space-y-4">
            {threads.map((thread) => (
              <Link
                href={`/messages/${thread.id}`}
                key={thread.id}
                className="flex items-center justify-between rounded-[1.5rem] border border-stone-200 px-5 py-4 hover:bg-stone-50"
              >
                <div>
                  <p className="text-sm text-stone-500">{thread.experiences?.location ?? "Location private"}</p>
                  <p className="text-lg font-semibold text-stone-950">{thread.experiences?.title ?? "Conversation"}</p>
                </div>
                <p className="text-sm text-stone-600">{thread.unlocked_at.slice(0, 10)}</p>
              </Link>
            ))}
            {threads.length === 0 ? (
              <p className="rounded-[1.5rem] border border-dashed border-stone-300 p-6 text-sm text-stone-500">
                Conversations unlock only after an offer is selected and captured.
              </p>
            ) : null}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
