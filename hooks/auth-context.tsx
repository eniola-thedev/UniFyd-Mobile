import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useAuth } from "./use-auth";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ session: null, user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useAuth();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the current session/user anywhere in the app. */
export function useSession() {
  return useContext(AuthContext);
}
