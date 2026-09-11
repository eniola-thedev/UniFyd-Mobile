import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, Trash2, X } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Database } from "@/lib/database.types";

type Report = Database["public"]["Tables"]["reports"]["Row"];
type Listing = { id: string; title: string; status: string };

export default function AdminReports() {
  const { user } = useSession();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [actionId, setActionId] = useState<string | null>(null);
  const { data: isAdmin, isLoading: loadingRole } = useQuery({
    queryKey: ["admin-role", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("id").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports"], enabled: isAdmin === true,
    queryFn: async () => {
      const { data: reports, error } = await supabase.from("reports").select("*").in("status", ["OPEN", "REVIEWING"]).order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (reports ?? []) as Report[];
      const listingIds = [...new Set(rows.flatMap((row) => row.listing_id ? [row.listing_id] : []))];
      const { data: listings, error: listingError } = listingIds.length ? await supabase.from("listings").select("id, title, status").in("id", listingIds) : { data: [], error: null };
      if (listingError) throw listingError;
      return { reports: rows, listings: (listings ?? []) as Listing[] };
    },
  });

  async function updateReport(report: Report, status: "REVIEWING" | "RESOLVED" | "DISMISSED") {
    if (!user) return;
    setActionId(report.id);
    const { error } = await supabase.from("reports").update({ status }).eq("id", report.id);
    setActionId(null);
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    toast.success(`Report marked ${status.toLowerCase()}`);
  }

  function removeListing(report: Report) {
    if (!report.listing_id) return;
    Alert.alert("Remove listing?", "This will hide the listing from the marketplace.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => void removeConfirmed(report) },
    ]);
  }

  async function removeConfirmed(report: Report) {
    setActionId(report.id);
    const { error } = await supabase.from("listings").update({ status: "REMOVED" }).eq("id", report.listing_id!);
    if (!error) await supabase.from("reports").update({ status: "RESOLVED" }).eq("id", report.id);
    setActionId(null);
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    await queryClient.invalidateQueries({ queryKey: ["listings"] });
    toast.success("Listing removed and report resolved");
  }

  if (loadingRole || isLoading) return <View className="flex-1 bg-background p-4"><View className="h-40 rounded-2xl bg-muted" /></View>;
  if (!isAdmin) return <View className="flex-1 items-center justify-center bg-background px-8"><Text className="text-center text-xl font-bold text-foreground">Admin access required</Text></View>;

  const listingById = new Map((data?.listings ?? []).map((listing) => [listing.id, listing]));
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4 pb-12">
      <View><Text className="text-2xl font-bold text-foreground">Listing reports</Text><Text className="mt-1 text-sm text-muted-foreground">Review reports and protect the UniFyd marketplace.</Text></View>
      {(data?.reports ?? []).length === 0 && <View className="items-center rounded-2xl border border-dashed border-border p-10"><Text className="text-muted-foreground">No open reports.</Text></View>}
      {(data?.reports ?? []).map((report) => {
        const listing = report.listing_id ? listingById.get(report.listing_id) : undefined;
        return <Card key={report.id} className="gap-3">
          <View className="flex-row items-center justify-between"><Text className="font-semibold text-foreground">{listing?.title ?? "Listing unavailable"}</Text><Badge variant="outline">{report.status}</Badge></View>
          <Text className="text-sm text-foreground">Reason: {report.reason}</Text>
          {report.description && <Text className="text-sm text-muted-foreground">{report.description}</Text>}
          <Text className="text-xs text-muted-foreground">Reported {new Date(report.created_at).toLocaleDateString()}</Text>
          <View className="flex-row flex-wrap gap-2">
            {report.status === "OPEN" && <Button variant="outline" loading={actionId === report.id} onPress={() => void updateReport(report, "REVIEWING")}><View className="flex-row items-center gap-1"><Eye size={15} color="#1B2436" /><Text className="font-semibold text-foreground">Review</Text></View></Button>}
            <Button variant="outline" loading={actionId === report.id} onPress={() => void updateReport(report, "DISMISSED")}><View className="flex-row items-center gap-1"><X size={15} color="#697182" /><Text className="font-semibold text-foreground">Dismiss</Text></View></Button>
            {listing && <Button variant="destructive" loading={actionId === report.id} onPress={() => removeListing(report)}><View className="flex-row items-center gap-1"><Trash2 size={15} color="#FCFCFC" /><Text className="font-semibold text-destructive-foreground">Remove listing</Text></View></Button>}
            {report.status === "REVIEWING" && <Button loading={actionId === report.id} onPress={() => void updateReport(report, "RESOLVED")}><View className="flex-row items-center gap-1"><Check size={15} color="#FCFCFC" /><Text className="font-semibold text-primary-foreground">Resolve</Text></View></Button>}
          </View>
        </Card>;
      })}
    </ScrollView>
  );
}
