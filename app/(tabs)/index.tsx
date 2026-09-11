import { useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Search, Sparkles, SlidersHorizontal } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { ListingImage } from "@/components/listing-image";
import { ALL_CATEGORIES, UNIVERSITIES, formatNaira } from "@/lib/constants";
import type { Database } from "@/lib/database.types";
import { useSavedListings } from "@/hooks/use-saved-listings";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

export default function Marketplace() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("ALL");
  const [uni, setUni] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const { savedIds, toggleSaved, isToggling } = useSavedListings();

  const { data: listings, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["listings", q, category, uni],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("*")
        .eq("status", "ACTIVE")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);
      if (category !== "ALL") query = query.eq("category", category);
      if (uni !== "ALL") query = query.eq("university", uni as "UNILORIN" | "AL_HIKMAH" | "KWASU");
      if (q.trim()) query = query.ilike("title", `%${q.trim()}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-4 pb-3 pt-2">
        <Text className="text-2xl font-bold text-foreground">Campus marketplace</Text>
        <Text className="text-sm text-muted-foreground">Trusted listings from verified students.</Text>

        <View className="mt-4 flex-row items-center gap-2">
          <View className="relative flex-1">
            <View className="absolute left-3 top-3.5 z-10">
              <Search size={16} color="#697182" />
            </View>
            <Input value={q} onChangeText={setQ} placeholder="Search listings…" className="pl-9" />
          </View>
          <Pressable
            onPress={() => setShowFilters((v) => !v)}
            className={`h-12 w-12 items-center justify-center rounded-xl border ${showFilters ? "border-primary bg-accent" : "border-border bg-white"}`}
          >
            <SlidersHorizontal size={18} color={showFilters ? "#149A6B" : "#697182"} />
          </Pressable>
        </View>

        {showFilters && (
          <View className="mt-3 gap-3">
            <Select
              value={category}
              onChange={setCategory}
              placeholder="Category"
              options={[{ value: "ALL", label: "All categories" }, ...ALL_CATEGORIES.map((c) => ({ value: c, label: c }))]}
            />
            <Select
              value={uni}
              onChange={setUni}
              placeholder="University"
              options={[{ value: "ALL", label: "All universities" }, ...UNIVERSITIES.map((u) => ({ value: u.value, label: u.label }))]}
            />
          </View>
        )}
      </View>

      <FlatList
        data={listings ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#149A6B" />}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center rounded-2xl border border-dashed border-border p-10">
              <Text className="text-center text-muted-foreground">No listings yet. Be the first to post one!</Text>
            </View>
          ) : null
        }
        renderItem={({ item }: { item: Listing }) => (
          <Pressable
            onPress={() => router.push(`/listing/${item.id}`)}
            className="flex-1 overflow-hidden rounded-2xl border border-border bg-card"
          >
            <View className="aspect-square w-full bg-muted">
              <ListingImage path={item.images?.[0] ?? null} />
              <Pressable
                accessibilityLabel={savedIds.has(item.id) ? "Remove from saved listings" : "Save listing"}
                onPress={() => toggleSaved(item.id)}
                disabled={isToggling}
                className="absolute right-2 top-2 h-9 w-9 items-center justify-center rounded-full bg-white/90"
              >
                <Heart size={18} color={savedIds.has(item.id) ? "#D6362E" : "#1B2436"} fill={savedIds.has(item.id) ? "#D6362E" : "transparent"} />
              </Pressable>
              {item.is_featured && (
                <View className="absolute left-2 top-2">
                  <Badge>
                    <View className="flex-row items-center gap-1">
                      <Sparkles size={12} color="#FCFCFC" />
                      <Text className="text-xs font-medium text-primary-foreground">Featured</Text>
                    </View>
                  </Badge>
                </View>
              )}
            </View>
            <View className="p-3">
              <Text className="text-base font-semibold text-foreground">{formatNaira(Number(item.price))}</Text>
              <Text numberOfLines={1} className="text-sm text-foreground">
                {item.title}
              </Text>
              <Text className="mt-1 text-xs text-muted-foreground">
                {item.university} • {item.condition}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
