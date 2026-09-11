import { useState } from "react";
import { Alert, View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Pencil, PlusCircle, Trash2 } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingImage } from "@/components/listing-image";
import { formatNaira } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

export default function MyListings() {
  const { user } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [actionId, setActionId] = useState<string | null>(null);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function markSold(listing: Listing) {
    if (!user || listing.status === "SOLD") return;
    setActionId(listing.id);
    const { error } = await supabase
      .from("listings")
      .update({ status: "SOLD", sold_at: new Date().toISOString() })
      .eq("id", listing.id)
      .eq("seller_id", user.id);
    setActionId(null);
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["my-listings", user.id] });
    await queryClient.invalidateQueries({ queryKey: ["listing", listing.id] });
    toast.success("Listing marked as sold");
  }

  function confirmMarkSold(listing: Listing) {
    Alert.alert("Mark as sold?", "Buyers will no longer see this listing as available.", [
      { text: "Cancel", style: "cancel" },
      { text: "Mark sold", onPress: () => void markSold(listing) },
    ]);
  }

  function confirmDelete(listing: Listing) {
    Alert.alert("Delete listing?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void deleteListing(listing),
      },
    ]);
  }

  async function deleteListing(listing: Listing) {
    if (!user) return;
    setActionId(listing.id);
    const { error } = await supabase.from("listings").delete().eq("id", listing.id).eq("seller_id", user.id);
    setActionId(null);
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["my-listings", user.id] });
    await queryClient.invalidateQueries({ queryKey: ["listings"] });
    toast.success("Listing deleted");
  }

  return (
    <View className="flex-1 bg-background p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-foreground">My listings</Text>
        <Button onPress={() => router.push("/(tabs)/sell")}>
          <View className="flex-row items-center gap-2">
            <PlusCircle size={16} color="#FCFCFC" />
            <Text className="font-semibold text-primary-foreground">New listing</Text>
          </View>
        </Button>
      </View>

      <FlatList
        className="mt-4"
        data={listings ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center rounded-2xl border border-dashed border-border p-10">
              <Text className="text-center text-muted-foreground">You haven't posted anything yet.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }: { item: Listing }) => (
          <View>
            <Pressable
              onPress={() => router.push(`/listing/${item.id}`)}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <View className="aspect-video w-full bg-muted">
                <ListingImage path={item.images?.[0] ?? null} />
                <View className="absolute left-3 top-3">
                  <Badge>{item.status}</Badge>
                </View>
              </View>
              <View className="p-4">
                <Text className="text-lg font-semibold text-foreground">{formatNaira(Number(item.price))}</Text>
                <Text numberOfLines={1} className="text-sm text-foreground">
                  {item.title}
                </Text>
              </View>
            </Pressable>
            <Button
              variant="outline"
              className="mt-2"
              onPress={() => router.push(`/listing/edit/${item.id}`)}
            >
              <View className="flex-row items-center gap-2">
                <Pencil size={16} color="#1B2436" />
                <Text className="font-semibold text-foreground">Edit listing</Text>
              </View>
            </Button>
            <Button variant="outline" className="mt-2" onPress={() => router.push(`/offers/${item.id}`)}>
              View offers
            </Button>
            <View className="mt-2 flex-row gap-2">
              {item.status !== "SOLD" && item.status !== "REMOVED" && (
                <Button
                  variant="outline"
                  className="flex-1"
                  loading={actionId === item.id}
                  onPress={() => confirmMarkSold(item)}
                >
                  <View className="flex-row items-center gap-2">
                    <CheckCircle size={16} color="#149A6B" />
                    <Text className="font-semibold text-foreground">Mark sold</Text>
                  </View>
                </Button>
              )}
              <Button
                variant="destructive"
                className="flex-1"
                loading={actionId === item.id}
                onPress={() => confirmDelete(item)}
              >
                <View className="flex-row items-center gap-2">
                  <Trash2 size={16} color="#FCFCFC" />
                  <Text className="font-semibold text-destructive-foreground">Delete</Text>
                </View>
              </Button>
            </View>
          </View>
        )}
      />
    </View>
  );
}
