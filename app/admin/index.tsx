import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Flag, LogOut, ShieldAlert } from "lucide-react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminAccess } from "@/hooks/use-admin-access";
import { useSession } from "@/hooks/auth-context";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useSession();
  const { isAdmin, isLoading: checkingAccess } = useAdminAccess();
  const { data: pendingCount = 0, isLoading: loadingCount } = useQuery({
    queryKey: ["admin-pending-verifications"],
    enabled: isAdmin,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("verifications")
        .select("id", { count: "exact", head: true })
        .eq("status", "PENDING");
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (checkingAccess || loadingCount) {
    return <View className="flex-1 bg-background p-4"><View className="h-40 rounded-2xl bg-muted" /></View>;
  }

  if (!isAdmin) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <ShieldAlert size={32} color="#D6362E" />
        <Text className="mt-4 text-center text-xl font-bold text-foreground">Admin access required</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 p-4 pb-12">
      <View>
        <Text className="text-2xl font-bold text-foreground">Admin dashboard</Text>
        <Text className="mt-1 text-sm text-muted-foreground">Signed in as {user?.email}</Text>
      </View>

      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-foreground">Student verifications</Text>
          <Badge variant={pendingCount > 0 ? "destructive" : "outline"}>{pendingCount} pending</Badge>
        </View>
        <Text className="text-sm text-muted-foreground">Review student IDs and approve or reject seller access.</Text>
        <Button onPress={() => router.push("/admin/verifications")}>
          <View className="flex-row items-center gap-2">
            <ShieldAlert size={16} color="#FCFCFC" />
            <Text className="font-semibold text-primary-foreground">Review verifications</Text>
          </View>
        </Button>
      </Card>

      <Card className="gap-3">
        <Text className="text-lg font-semibold text-foreground">Listing reports</Text>
        <Text className="text-sm text-muted-foreground">Review reports submitted by marketplace users.</Text>
        <Button variant="outline" onPress={() => router.push("/admin/reports")}>
          <View className="flex-row items-center gap-2">
            <Flag size={16} color="#1B2436" />
            <Text className="font-semibold text-foreground">Review reports</Text>
          </View>
        </Button>
      </Card>

      <Button variant="outline" onPress={() => void supabase.auth.signOut()}>
        <View className="flex-row items-center gap-2">
          <LogOut size={16} color="#1B2436" />
          <Text className="font-semibold text-foreground">Sign out</Text>
        </View>
      </Button>
    </ScrollView>
  );
}