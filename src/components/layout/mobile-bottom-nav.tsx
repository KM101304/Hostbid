"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, MessageSquare, Plus, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Compass },
  { href: "/experiences", label: "Browse", icon: Compass },
  { href: "/experiences/new", label: "Create", icon: Plus },
  { href: "/dashboard", label: "Hub", icon: UserRound },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  if (!pathname || !navItems.some((item) => isActivePath(pathname, item.href))) {
    return null;
  }

  return (
    <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 md:hidden">
      <div className="mx-auto flex max-w-md items-stretch gap-1 rounded-[20px] border border-white/70 bg-white/84 p-1.5 shadow-soft-lg backdrop-blur-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
              className={cn("mobile-nav-link", isActivePath(pathname, item.href) && "mobile-nav-link-active")}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
