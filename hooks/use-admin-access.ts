import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/auth-context";
import { supabase } from "@/lib/supabase";

export const VERIFICATION_ADMIN_EMAIL = "abondeabdullahi2004@gmail.com";

export function useAdminAccess() {
  const { user } = useSession();
  const emailMatches = user?.email?.trim().toLowerCase() === VERIFICATION_ADMIN_EMAIL;
  const query = useQuery({
    queryKey: ["admin-role", user?.id],
    enabled: emailMatches,
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .limit(1);
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
  });

  return {
    isAdmin: emailMatches && query.data === true,
    isLoading: emailMatches && query.isLoading,
  };
}