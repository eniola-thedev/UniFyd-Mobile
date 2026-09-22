import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) void claimStoredReferral();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}

/** Claims a stored referral code in the background. Never blocks the UI. */
async function claimStoredReferral() {
  try {
    const code = await AsyncStorage.getItem("unifyd-referral-code");
    if (!code) return;
    // Run in the background with a timeout so a slow RPC can never hang the app.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const { error } = await supabase.rpc("claim_referral", { p_code: code });
      if (!error) await AsyncStorage.removeItem("unifyd-referral-code");
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Ignore - referral claiming is best-effort.
  }
}
