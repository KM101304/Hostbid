import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MessageComposer } from "@/components/chat/message-composer";
import { getAuthenticatedUser } from "@/lib/auth";
import { getThreadDetail } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const { thread, messages } = await getThreadDetail(threadId, user.id);

  if (!thread) {
    notFound();
  }

  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-5xl gap-6 px-5 py-10 lg:px-8">
        <section className="rounded-[2rem] border border-stone-200 bg-white p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Active thread</p>
          <h1 className="mt-3 font-serif text-4xl text-stone-950">{thread.experiences?.title ?? "Conversation"}</h1>
          <p className="mt-2 text-stone-600">{thread.experiences?.location}</p>
        </section>

        <section className="space-y-4 rounded-[2rem] border border-stone-200 bg-white p-6">
          {messages.map((message) => (
            <article key={message.id} className="rounded-[1.5rem] bg-stone-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{formatDateTime(message.created_at)}</p>
              <p className="mt-2 text-sm text-stone-800">{message.body}</p>
            </article>
          ))}
          {messages.length === 0 ? <p className="text-sm text-stone-500">No messages yet.</p> : null}
        </section>

        <MessageComposer threadId={threadId} />
      </main>
    </AppShell>
  );
}
