import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PublicEnvScript } from "@/components/env/public-env-script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HostBid",
  description: "A premium social platform for curated experiences, thoughtful offers, and trusted connections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const publicSupabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

  return (
    <html lang="en" className={inter.variable}>
      <body>
        <PublicEnvScript
          appUrl={publicAppUrl}
          supabaseUrl={publicSupabaseUrl}
          supabasePublicKey={publicSupabaseKey}
        />
        {children}
      </body>
    </html>
  );
}
