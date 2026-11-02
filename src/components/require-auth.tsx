"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { OmicronLoader } from "@/components/omicron-loader";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      const next = `${window.location.pathname}${window.location.search}`;
      router.replace("/login?next=" + encodeURIComponent(next));
    }
  }, [ready, user, router]);

  if (!ready) {
    return <OmicronLoader variant="screen" label="Loading your session…" />;
  }

  if (!user) {
    return <OmicronLoader variant="screen" label="Redirecting to login…" />;
  }

  return <>{children}</>;
}
