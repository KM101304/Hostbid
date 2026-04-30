import type { Metadata, Viewport } from "next";
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
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const publicGoogleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const publicSupabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

  return (
    <html lang="en" className={inter.variable}>
      <body>
        <PublicEnvScript
          appUrl={publicAppUrl}
          googleMapsApiKey={publicGoogleMapsApiKey}
          supabaseUrl={publicSupabaseUrl}
          supabasePublicKey={publicSupabaseKey}
        />
        {children}
      </body>
    </html>
  );
}
