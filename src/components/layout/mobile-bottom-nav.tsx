"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, MessageSquare, Plus, Shield, UserRound } from "lucide-react";

const navItems = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/dashboard", label: "Hub", icon: UserRound },
  { href: "/experiences/new", label: "Create", icon: Plus },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/moderation", label: "Safety", icon: Shield },
];

const visibleRoutes = new Set(["/", "/dashboard", "/messages", "/moderation"]);

export function MobileBottomNav() {
  const pathname = usePathname();

  if (!pathname || !visibleRoutes.has(pathname)) {
    return null;
  }

  return (
    <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 md:hidden">
      <div className="mx-auto flex max-w-md items-stretch gap-1 rounded-[20px] border border-white/70 bg-white/84 p-1.5 shadow-soft-lg backdrop-blur-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="mobile-nav-link">
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
