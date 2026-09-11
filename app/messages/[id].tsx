import { useEffect, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Message = {
  id: string;
  listing_id: string | null;
  sender_id: string;
  receiver_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

type Listing = { title: string };

export default function Conversation() {
  const { id: listingId, receiverId } = useLocalSearchParams<{ id: string; receiverId?: string }>();
  const { user } = useSession();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["conversation", user?.id, listingId, receiverId],
    enabled: !!user && !!receiverId && listingId !== "general",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("listing_id", listingId)
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user!.id})`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });

  const { data: listing } = useQuery({
    queryKey: ["message-listing", listingId],
    enabled: listingId !== "general",
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("title").eq("id", listingId).maybeSingle();
      if (error) throw error;
      return data as Listing | null;
    },
  });

  useEffect(() => {
    if (!user || !receiverId || listingId === "general") return;
    const unreadIds = messages
      .filter((message) => message.receiver_id === user.id && !message.read_at)
      .map((message) => message.id);
    if (unreadIds.length === 0) return;
    supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds)
      .eq("receiver_id", user.id)
      .then(({ error }) => {
        if (!error) {
          queryClient.invalidateQueries({ queryKey: ["message-inbox", user.id] });
          queryClient.invalidateQueries({ queryKey: ["conversation", user.id, listingId, receiverId] });
        }
      });
  }, [listingId, messages, queryClient, receiverId, user]);

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!user || !receiverId || listingId === "general") throw new Error("This conversation is unavailable");
      const { error } = await supabase.from("messages").insert({
        listing_id: listingId,
        sender_id: user.id,
        receiver_id: receiverId,
        message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["conversation", user?.id, listingId, receiverId] });
      queryClient.invalidateQueries({ queryKey: ["message-inbox", user?.id] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not send message"),
  });

  useEffect(() => {
    if (!user || !receiverId || listingId === "general") return;
    const channel = supabase
      .channel(`messages:${listingId}:${user.id}:${receiverId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `listing_id=eq.${listingId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversation", user.id, listingId, receiverId] });
        queryClient.invalidateQueries({ queryKey: ["message-inbox", user.id] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [listingId, queryClient, receiverId, user]);

  const canSend = draft.trim().length > 0 && !sendMessage.isPending;
  const title = listing?.title ?? "Conversation";
  const empty = !isLoading && messages.length === 0;

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View className="flex-row items-center gap-3 border-b border-border bg-white px-4 pb-3 pt-12">
        <Pressable accessibilityLabel="Go back" onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-muted">
          <ArrowLeft size={20} color="#1B2436" />
        </Pressable>
        <View className="flex-1">
          <Text numberOfLines={1} className="font-semibold text-foreground">{title}</Text>
          <Text className="text-xs text-muted-foreground">Conversation</Text>
        </View>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1, gap: 8, padding: 16 }}
        ListEmptyComponent={empty ? <Text className="m-auto text-center text-muted-foreground">Start the conversation about this listing.</Text> : null}
        renderItem={({ item }) => {
          const mine = item.sender_id === user?.id;
          return (
            <View className={`max-w-[82%] rounded-2xl px-4 py-3 ${mine ? "self-end bg-primary" : "self-start bg-white border border-border"}`}>
              <Text className={mine ? "text-primary-foreground" : "text-foreground"}>{item.message}</Text>
              <Text className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </Text>
            </View>
          );
        }}
      />
      <View className="flex-row items-end gap-2 border-t border-border bg-white p-3">
        <Input value={draft} onChangeText={setDraft} placeholder="Write a message" multiline className="max-h-24 flex-1" />
        <Button accessibilityLabel="Send message" onPress={() => sendMessage.mutate(draft.trim())} disabled={!canSend} loading={sendMessage.isPending} className="h-12 w-12 px-0">
          <Send size={18} color="#FCFCFC" />
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
