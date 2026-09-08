"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import type { User } from "@/types";

type ProfileRow = User & { credits_used?: number };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAppStore((s) => s.setUser);
  const setNotifications = useAppStore((s) => s.setNotifications);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const loadProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      const row = profile as ProfileRow | null;
      if (!row) return;

      setUser({
        id: row.id,
        email: row.email,
        name: row.name,
        credits_remaining: row.credits_remaining,
        created_at: row.created_at,
      });

      // The navbar bell reads these out of the store.
      const response = await fetch("/api/notifications");
      if (response.ok) setNotifications(await response.json());
    };

    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (data.user) loadProfile(data.user.id);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: string, session: { user: { id: string } } | null) => {
        if (event === "SIGNED_IN" && session?.user) {
          await loadProfile(session.user.id);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setNotifications]);

  return <>{children}</>;
}
