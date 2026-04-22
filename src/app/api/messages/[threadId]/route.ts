import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { applyRateLimitHeaders, getClientIp } from "@/lib/request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { messageSchema } from "@/lib/validators";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const { threadId } = await params;
    const user = await requireUser();
    const admin = createSupabaseAdminClient();

    const { data: thread } = await admin.from("threads").select("*").eq("id", threadId).maybeSingle();

    if (!thread || (thread.poster_id !== user.id && thread.bidder_id !== user.id)) {
      throw new Error("Thread not found.");
    }

    const { data } = await admin
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false })
      .limit(100);

    return NextResponse.json({ messages: (data ?? []).reverse() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch messages." },
      { status: 400 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const { threadId } = await params;
    const user = await requireUser();
    const rateLimit = checkRateLimit({
      key: `message:create:${user.id}:${threadId}:${getClientIp(request)}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: "You are sending messages too quickly. Please slow down and try again." },
          { status: 429 },
        ),
        rateLimit,
      );
    }

    const admin = createSupabaseAdminClient();
    const body = await request.json();
    const parsed = messageSchema.parse(body);
    const { data: thread } = await admin.from("threads").select("*").eq("id", threadId).maybeSingle();

    if (!thread || (thread.poster_id !== user.id && thread.bidder_id !== user.id)) {
      throw new Error("Thread not found.");
    }

    const { data, error } = await admin
      .from("messages")
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        body: parsed.body,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return applyRateLimitHeaders(NextResponse.json({ message: data }), rateLimit);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send message." },
      { status: 400 },
    );
  }
}
