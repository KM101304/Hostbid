import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MessageComposer } from "@/components/chat/message-composer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
      <main className="mx-auto grid w-full max-w-5xl gap-6 px-5 py-8 lg:px-8 lg:py-10">
        <Card as="section" className="space-y-3 p-6 sm:p-8">
          <Badge tone="success">Accepted thread</Badge>
          <h1 className="text-[36px] font-bold tracking-[-0.04em] text-slate-900">
            {thread.experiences?.title ?? "Conversation"}
          </h1>
          <p className="text-slate-600">{thread.experiences?.location}</p>
        </Card>

        <Card as="section" className="space-y-4 p-6 sm:p-8">
          {messages.map((message) => (
            <article key={message.id} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {formatDateTime(message.created_at)}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{message.body}</p>
            </article>
          ))}
          {messages.length === 0 ? <p className="text-sm text-slate-500">No messages yet.</p> : null}
        </Card>

        <MessageComposer threadId={threadId} />
      </main>
    </AppShell>
  );
}
