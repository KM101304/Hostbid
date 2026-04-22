import Link from "next/link";
import { MessageSquare, Plus, Shield, UserCircle2 } from "lucide-react";
import { getAuthenticatedUser, getCurrentProfile } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export async function TopNav() {
  const user = await getAuthenticatedUser();
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[rgba(248,246,242,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-stone-950 text-sm font-bold text-stone-50">
            HB
          </div>
          <div>
            <p className="font-serif text-xl tracking-tight text-stone-950">HostBid</p>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              Experience-led dating marketplace
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/" className="rounded-full px-4 py-2 text-sm text-stone-700 hover:bg-white">
            Discover
          </Link>
          <Link href="/dashboard" className="rounded-full px-4 py-2 text-sm text-stone-700 hover:bg-white">
            Dashboard
          </Link>
          <Link href="/experiences/new" className="rounded-full px-4 py-2 text-sm text-stone-700 hover:bg-white">
            Post experience
          </Link>
          <Link href="/messages" className="rounded-full px-4 py-2 text-sm text-stone-700 hover:bg-white">
            Messages
          </Link>
          <Link href="/moderation" className="rounded-full px-4 py-2 text-sm text-stone-700 hover:bg-white">
            Safety
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/experiences/new" className="hidden md:block">
                <Button variant="secondary" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Post
                </Button>
              </Link>
              <Link href="/messages" className="rounded-full border border-stone-200 p-3 text-stone-700 hover:bg-white">
                <MessageSquare className="h-4 w-4" />
              </Link>
              <Link href="/moderation" className="rounded-full border border-stone-200 p-3 text-stone-700 hover:bg-white">
                <Shield className="h-4 w-4" />
              </Link>
              <Link href="/profile" className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-3 py-2">
                {profile?.avatar_url ? (
                  <Avatar
                    src={profile.avatar_url}
                    alt={profile.full_name ?? "Profile"}
                    className="h-9 w-9"
                    fallback={profile?.full_name?.slice(0, 1)}
                  />
                ) : (
                  <UserCircle2 className="h-5 w-5 text-stone-700" />
                )}
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium text-stone-900">
                    {profile?.full_name ?? user.email ?? "Your profile"}
                  </p>
                  <p className="text-xs text-stone-500">Quality score {profile?.quality_score ?? 0}</p>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="secondary">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button>Create account</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
