import type { PropsWithChildren } from "react";
import { TopNav } from "@/components/layout/top-nav";

export async function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(205,186,164,0.34),_transparent_32%),linear-gradient(180deg,_#f8f6f2_0%,_#f2eee8_100%)]">
      <TopNav />
      {children}
    </div>
  );
}
