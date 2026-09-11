import { useMemo } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { MessagesSquare } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";
import { formatNaira } from "@/lib/constants";

type Message = {
  id: string;
  listing_id: string | null;
  sender_id: string;
  receiver_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

type Profile = { id: string; full_name: string };
type Listing = { id: string; title: string; price: number };

export default function Messages() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useSession();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["message-inbox", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const messages = (rows ?? []) as Message[];
      const otherIds = [...new Set(messages.map((row) => (row.sender_id === user!.id ? row.receiver_id : row.sender_id)))];
      const listingIds = [...new Set(messages.flatMap((row) => (row.listing_id ? [row.listing_id] : [])))];
      const [{ data: profiles }, { data: listings }] = await Promise.all([
        otherIds.length ? supabase.from("profiles").select("id, full_name").in("id", otherIds) : Promise.resolve({ data: [] as Profile[] }),
        listingIds.length ? supabase.from("listings").select("id, title, price").in("id", listingIds) : Promise.resolve({ data: [] as Listing[] }),
      ]);
      return { messages, profiles: (profiles ?? []) as Profile[], listings: (listings ?? []) as Listing[] };
    },
  });

  const conversations = useMemo(() => {
    const map = new Map<string, { message: Message; otherId: string; unreadCount: number }>();
    for (const message of data?.messages ?? []) {
      const otherId = message.sender_id === user?.id ? message.receiver_id : message.sender_id;
      const key = `${otherId}:${message.listing_id ?? "general"}`;
      const current = map.get(key);
      if (current) {
        if (message.receiver_id === user?.id && !message.read_at) current.unreadCount += 1;
      } else {
        map.set(key, { message, otherId, unreadCount: message.receiver_id === user?.id && !message.read_at ? 1 : 0 });
      }
    }
    return [...map.values()];
  }, [data?.messages, user?.id]);

  const profileById = new Map((data?.profiles ?? []).map((profile) => [profile.id, profile]));
  const listingById = new Map((data?.listings ?? []).map((listing) => [listing.id, listing]));

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-4 pb-3 pt-2">
        <Text className="text-2xl font-bold text-foreground">Messages</Text>
        <Text className="mt-1 text-sm text-muted-foreground">Talk to buyers and sellers about listings.</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={({ message, otherId }) => `${otherId}:${message.listing_id ?? "general"}`}
        contentContainerStyle={{ gap: 10, padding: 16, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#149A6B" />}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center rounded-2xl border border-dashed border-border p-10">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-accent">
                <MessagesSquare size={28} color="#215240" />
              </View>
              <Text className="mt-4 text-lg font-semibold text-foreground">No messages yet</Text>
              <Text className="mt-2 text-center text-muted-foreground">Open a listing and message the seller to start a conversation.</Text>
            </View>
          ) : null
        }
        renderItem={({ item: conversation }) => {
          const listing = conversation.message.listing_id ? listingById.get(conversation.message.listing_id) : undefined;
              const unread = conversation.unreadCount > 0;
          return (
            <Pressable
              onPress={() => router.push({ pathname: "/messages/[id]", params: { id: conversation.message.listing_id ?? "general", receiverId: conversation.otherId } })}
              className={`rounded-2xl border p-4 ${unread ? "border-primary bg-accent" : "border-border bg-card"}`}
            >
              <View className="flex-row items-center justify-between gap-3">
                <Text className="flex-1 font-semibold text-foreground">{profileById.get(conversation.otherId)?.full_name ?? "UniFyd user"}</Text>
                <View className="flex-row items-center gap-2">
                  {unread && <Text className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{conversation.unreadCount}</Text>}
                  <Text className="text-xs text-muted-foreground">{new Date(conversation.message.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
              {listing && <Text numberOfLines={1} className="mt-1 text-xs text-primary">{listing.title} · {formatNaira(Number(listing.price))}</Text>}
              <Text numberOfLines={2} className="mt-2 text-sm text-muted-foreground">{conversation.message.message}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
