import { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldAlert, X } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";
import { useSignedUrl } from "@/hooks/use-signed-url";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Label } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { universityLabel } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type Verification = Database["public"]["Tables"]["verifications"]["Row"];
type Profile = { id: string; full_name: string; email: string };

function VerificationCard({
  verification,
  profile,
  actionId,
  onReview,
}: {
  verification: Verification;
  profile?: Profile;
  actionId: string | null;
  onReview: (verification: Verification, status: "APPROVED" | "REJECTED", notes: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const idUrl = useSignedUrl(verification.student_id_url);
  const busy = actionId === verification.id;

  return (
    <Card className="gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{verification.full_name}</Text>
          <Text className="text-sm text-muted-foreground">{profile?.email ?? "Student account"}</Text>
        </View>
        <Badge variant="outline">PENDING</Badge>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {[
          ["University", universityLabel(verification.university)],
          ["Department", verification.department],
          ["Level", verification.level],
          ["Matric number", verification.matric_number],
        ].map(([label, value]) => (
          <View key={label} className="w-[47%] rounded-xl bg-muted p-3">
            <Text className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Text>
            <Text className="mt-1 font-medium text-foreground">{value}</Text>
          </View>
        ))}
      </View>

      {idUrl ? (
        <Image source={{ uri: idUrl }} className="h-64 w-full rounded-xl border border-border" resizeMode="contain" />
      ) : (
        <View className="h-32 items-center justify-center rounded-xl bg-muted">
          <Text className="text-sm text-muted-foreground">Loading student ID photo...</Text>
        </View>
      )}

      <View>
        <Label>Reviewer note</Label>
        <Input value={notes} onChangeText={setNotes} placeholder="Optional for approval, required for rejection" />
      </View>

      <View className="flex-row gap-3">
        <Button
          className="flex-1"
          loading={busy}
          onPress={() => onReview(verification, "APPROVED", notes.trim())}
        >
          <View className="flex-row items-center gap-2">
            <Check size={16} color="#FCFCFC" />
            <Text className="font-semibold text-primary-foreground">Approve</Text>
          </View>
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          loading={busy}
          onPress={() => onReview(verification, "REJECTED", notes.trim())}
        >
          <View className="flex-row items-center gap-2">
            <X size={16} color="#FCFCFC" />
            <Text className="font-semibold text-destructive-foreground">Reject</Text>
          </View>
        </Button>
      </View>
    </Card>
  );
}

export default function AdminVerifications() {
  const { user } = useSession();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [actionId, setActionId] = useState<string | null>(null);

  const { data: isAdmin, isLoading: loadingRole } = useQuery({
    queryKey: ["admin-role", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("id").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const { data: verifications, isLoading } = useQuery({
    queryKey: ["admin-verifications"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase.from("verifications").select("*").eq("status", "PENDING").order("submitted_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as Verification[];
      const userIds = [...new Set(rows.map((row) => row.user_id))];
      const { data: profiles, error: profileError } = userIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
        : { data: [], error: null };
      if (profileError) throw profileError;
      return { rows, profiles: (profiles ?? []) as Profile[] };
    },
  });

  async function review(verification: Verification, status: "APPROVED" | "REJECTED", notes: string) {
    if (!user) return;
    if (status === "REJECTED" && !notes) return toast.error("Add a reviewer note when rejecting an application");
    setActionId(verification.id);
    const { error } = await supabase
      .from("verifications")
      .update({ status, notes: notes || null, reviewer_id: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", verification.id);
    setActionId(null);
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
    await queryClient.invalidateQueries({ queryKey: ["verification", verification.user_id] });
    toast.success(status === "APPROVED" ? "Verification approved" : "Verification rejected");
  }

  if (loadingRole || isLoading) {
    return <View className="flex-1 bg-background p-4"><View className="h-40 rounded-2xl bg-muted" /></View>;
  }

  if (!isAdmin) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <ShieldAlert size={32} color="#D6362E" />
        <Text className="mt-4 text-center text-xl font-bold text-foreground">Admin access required</Text>
        <Text className="mt-2 text-center text-muted-foreground">Your account is not allowed to review verifications.</Text>
      </View>
    );
  }

  const profileById = new Map((verifications?.profiles ?? []).map((profile) => [profile.id, profile]));
  const pendingCount = verifications?.rows.length ?? 0;
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4 pb-12">
      <View>
        <Text className="text-2xl font-bold text-foreground">Verification review</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          {pendingCount > 0
            ? `${pendingCount} student${pendingCount === 1 ? "" : "s"} waiting for review.`
            : "Review student IDs before sellers can publish listings."}
        </Text>
      </View>
      {(verifications?.rows ?? []).length === 0 ? (
        <View className="items-center rounded-2xl border border-dashed border-border p-10">
          <Text className="text-lg font-semibold text-foreground">No pending reviews</Text>
          <Text className="mt-2 text-center text-muted-foreground">New verification requests will appear here.</Text>
        </View>
      ) : (
        verifications!.rows.map((verification) => (
          <VerificationCard
            key={verification.id}
            verification={verification}
            profile={profileById.get(verification.user_id)}
            actionId={actionId}
            onReview={review}
          />
        ))
      )}
    </ScrollView>
  );
}
