import type { PropsWithChildren } from "react";
import { TopNav } from "@/components/layout/top-nav";

export async function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-transparent">
      <TopNav />
      <div className="pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-10">{children}</div>
    </div>
  );
}
