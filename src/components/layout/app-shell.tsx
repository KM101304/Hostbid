import type { PropsWithChildren } from "react";
import { TopNav } from "@/components/layout/top-nav";

export async function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-transparent">
      <TopNav />
      <div className="pb-44 md:pb-10">{children}</div>
    </div>
  );
}
