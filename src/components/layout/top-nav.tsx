import Link from "next/link";
import { Compass, MessageSquare, Plus, UserCircle2, UserRound } from "lucide-react";
import { getAuthenticatedUser, getCurrentProfile } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

const desktopNavItems = [
  { href: "/", label: "Home", icon: Compass },
  { href: "/experiences", label: "Browse", icon: Compass },
  { href: "/dashboard", label: "Hub", icon: UserRound },
  { href: "/experiences/new", label: "Create", icon: Plus },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

export async function TopNav() {
  const user = await getAuthenticatedUser();
  const profile = await getCurrentProfile();
  const authMetadata = user?.user_metadata ?? {};
  const authName =
    typeof authMetadata.full_name === "string"
      ? authMetadata.full_name
      : typeof authMetadata.name === "string"
        ? authMetadata.name
        : null;
  const profileName = profile?.full_name?.trim() || authName?.trim() || "Complete your profile";
  const profileBadgeLabel =
    typeof profile?.quality_score === "number" && profile.quality_score > 0
      ? `Profile ${profile.quality_score}`
      : "In progress";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-5 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="brand-mark grid h-11 w-11 shrink-0 place-items-center text-[14px] font-semibold tracking-[-0.08em]">
              HB
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold tracking-[-0.04em] text-slate-900 sm:text-xl">HostBid</p>
              <p className="hidden text-xs text-slate-500 md:block">Curated social experiences with trusted offers</p>
            </div>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {desktopNavItems.map((item) => (
              <Link key={item.href} href={item.href} className="nav-link">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <Link href="/experiences/new" className="hidden xl:block">
                  <Button className="min-w-[152px]">Create experience</Button>
                </Link>
                <Link
                  href="/messages"
                  className="hidden h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-soft-md transition hover:-translate-y-0.5 hover:text-slate-900 md:inline-flex"
                >
                  <MessageSquare className="h-4 w-4" />
                </Link>
                <Link
                  href="/profile"
                  className="surface-subtle flex items-center gap-3 rounded-[18px] px-2.5 py-2 shadow-soft-md transition hover:-translate-y-0.5"
                >
                  {profile?.avatar_url ? (
                    <Avatar
                      src={profile.avatar_url}
                      alt={profile.full_name ?? "Profile"}
                      className="h-10 w-10"
                      fallback={profile.full_name?.slice(0, 1)}
                    />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600">
                      <UserCircle2 className="h-5 w-5" />
                    </div>
                  )}
                  <div className="hidden min-w-0 text-left md:block">
                    <p className="truncate text-sm font-semibold text-slate-900">{profileName}</p>
                    <div className="flex items-center gap-2">
                      <Badge tone="info" className="h-6 px-2 py-0 text-[11px]">
                        {profileBadgeLabel}
                      </Badge>
                    </div>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" className="px-4">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="px-4 sm:px-5">Create account</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {user ? <MobileBottomNav /> : null}
    </>
  );
}
