"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <Button type="button" variant="ghost" className="hidden px-3 md:inline-flex" onClick={handleLogout}>
      <LogOut className="h-4 w-4" />
      Log out
    </Button>
  );
}
