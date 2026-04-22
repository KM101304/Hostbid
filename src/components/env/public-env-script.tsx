type PublicEnvScriptProps = {
  appUrl: string;
  supabaseUrl: string;
  supabasePublicKey: string;
};

export function PublicEnvScript({
  appUrl,
  supabaseUrl,
  supabasePublicKey,
}: PublicEnvScriptProps) {
  const payload = JSON.stringify({
    NEXT_PUBLIC_APP_URL: appUrl,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabasePublicKey,
  }).replace(/</g, "\\u003c");

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__HOSTBID_ENV__ = ${payload};`,
      }}
    />
  );
}
