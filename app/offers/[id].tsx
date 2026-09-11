import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatNaira } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type Offer = Database["public"]["Tables"]["offers"]["Row"];

export default function ListingOffers() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [actionId, setActionId] = useState<string | null>(null);
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["listing-offers", id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("offers").select("*").eq("listing_id", id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Offer[];
    },
  });

  async function updateOffer(offer: Offer, status: "ACCEPTED" | "REJECTED") {
    setActionId(offer.id);
    const { error } = await supabase.from("offers").update({ status }).eq("id", offer.id);
    setActionId(null);
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["listing-offers", id, user?.id] });
    toast.success(status === "ACCEPTED" ? "Offer accepted" : "Offer rejected");
  }

  function confirm(offer: Offer, status: "ACCEPTED" | "REJECTED") {
    Alert.alert(status === "ACCEPTED" ? "Accept offer?" : "Reject offer?", `This will mark the offer as ${status.toLowerCase()}.`, [
      { text: "Cancel", style: "cancel" },
      { text: status === "ACCEPTED" ? "Accept" : "Reject", style: status === "REJECTED" ? "destructive" : "default", onPress: () => void updateOffer(offer, status) },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4 pb-12">
      <Text className="text-2xl font-bold text-foreground">Offers</Text>
      <Text className="text-sm text-muted-foreground">Review buyer offers for this listing.</Text>
      {!isLoading && offers.length === 0 && <View className="items-center rounded-2xl border border-dashed border-border p-10"><Text className="text-center text-muted-foreground">No offers yet.</Text></View>}
      {offers.map((offer) => (
        <Card key={offer.id} className="gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-xl font-bold text-primary">{formatNaira(Number(offer.amount))}</Text>
            <Badge variant={offer.status === "ACCEPTED" ? "success" : offer.status === "REJECTED" ? "destructive" : "outline"}>{offer.status}</Badge>
          </View>
          <Text className="text-sm text-muted-foreground">{offer.message || "No message"}</Text>
          <Text className="text-xs text-muted-foreground">Received {new Date(offer.created_at).toLocaleDateString()}</Text>
          {offer.status === "PENDING" && (
            <View className="flex-row gap-3">
              <Button className="flex-1" loading={actionId === offer.id} onPress={() => confirm(offer, "ACCEPTED")}>Accept</Button>
              <Button variant="destructive" className="flex-1" loading={actionId === offer.id} onPress={() => confirm(offer, "REJECTED")}>Reject</Button>
            </View>
          )}
        </Card>
      ))}
      <Button variant="outline" onPress={() => router.back()}>Back</Button>
    </ScrollView>
  );
}
