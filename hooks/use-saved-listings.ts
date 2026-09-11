import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";

const savedKey = (userId: string | undefined) => ["saved-listings", userId] as const;

export function useSavedListings() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: savedKey(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_listings").select("listing_id").eq("user_id", user!.id);
      if (error) throw error;
      return data?.map((row) => row.listing_id) ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ listingId, saved }: { listingId: string; saved: boolean }) => {
      if (!user) throw new Error("You must be signed in to save listings");
      if (saved) {
        const { error } = await supabase.from("saved_listings").delete().eq("user_id", user.id).eq("listing_id", listingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("saved_listings").insert({ user_id: user.id, listing_id: listingId });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedKey(user?.id) }),
  });

  return {
    savedIds: new Set(query.data ?? []),
    isLoading: query.isLoading,
    toggleSaved: (listingId: string) => mutation.mutate({ listingId, saved: query.data?.includes(listingId) ?? false }),
    isToggling: mutation.isPending,
  };
}
