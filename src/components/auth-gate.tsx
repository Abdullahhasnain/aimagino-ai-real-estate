import * as React from "react";
import type { Session } from "@supabase/supabase-js";
import { cloudConfigured, getCloudClient, getSession } from "@/services/cloud";
import LoginPage from "@/pages/login";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(cloudConfigured);

  React.useEffect(() => {
    if (!cloudConfigured) return;
    let active = true;
    getSession()
      .then((next) => { if (active) setSession(next); })
      .finally(() => { if (active) setLoading(false); });
    const subscription = getCloudClient()!.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  if (!cloudConfigured) return <>{children}</>;
  if (loading) return <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Loading secure workspace…</main>;
  if (!session) return <LoginPage />;
  return <>{children}</>;
}
