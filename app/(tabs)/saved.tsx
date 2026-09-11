import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Trash2 } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";
import { useSavedListings } from "@/hooks/use-saved-listings";
import { ListingImage } from "@/components/listing-image";
import { formatNaira } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

export default function Saved() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useSession();
  const { savedIds, isLoading: loadingSaved, toggleSaved, isToggling } = useSavedListings();
  const savedListingIds = [...savedIds];
  const { data: listings, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["saved-listing-records", user?.id, savedListingIds.join(",")],
    enabled: !!user && !loadingSaved,
    queryFn: async () => {
      if (savedListingIds.length === 0) return [];
      const { data, error } = await supabase.from("listings").select("*").in("id", savedListingIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-4 pb-3 pt-2">
        <Text className="text-2xl font-bold text-foreground">Saved listings</Text>
        <Text className="mt-1 text-sm text-muted-foreground">Keep track of items you may want to buy.</Text>
      </View>
      <FlatList
        data={(listings ?? []) as Listing[]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, padding: 16, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#149A6B" />}
        ListEmptyComponent={
          !isLoading && !loadingSaved ? (
            <View className="items-center rounded-2xl border border-dashed border-border p-10">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-accent">
                <Heart size={28} color="#215240" />
              </View>
              <Text className="mt-4 text-center text-lg font-semibold text-foreground">Nothing saved yet</Text>
              <Text className="mt-2 text-center text-muted-foreground">Tap the heart on a listing to save it for later.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/listing/${item.id}`)}
            className="flex-row overflow-hidden rounded-2xl border border-border bg-card"
          >
            <View className="h-28 w-28 bg-muted">
              <ListingImage path={item.images?.[0] ?? null} />
            </View>
            <View className="flex-1 justify-center p-3">
              <Text numberOfLines={1} className="font-semibold text-foreground">{item.title}</Text>
              <Text className="mt-1 font-bold text-primary">{formatNaira(Number(item.price))}</Text>
              <Text numberOfLines={1} className="mt-1 text-xs text-muted-foreground">{item.university} · {item.condition}</Text>
            </View>
            <Pressable
              accessibilityLabel="Remove saved listing"
              onPress={() => toggleSaved(item.id)}
              disabled={isToggling}
              className="m-3 h-9 w-9 items-center justify-center rounded-full bg-muted"
            >
              <Trash2 size={16} color="#697182" />
            </Pressable>
          </Pressable>
        )}
      />
    </View>
  );
}
