import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { BadgeCheck, Bell, Settings, ShieldAlert, LogOut, Pencil } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";
import { Badge } from "@/components/ui/badge";
import { Card, Label } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { UNIVERSITIES, universityLabel } from "@/lib/constants";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  university: z.enum(["UNILORIN", "AL_HIKMAH", "KWASU", "UNIOSUN"]),
  department: z.string().trim().min(2, "Enter your department").max(80),
  level: z.string().trim().min(1, "Enter your level").max(10),
  matric_number: z.string().trim().min(3, "Enter your matric number").max(30),
  phone: z.string().trim().min(7, "Enter your phone number").max(20),
  bio: z.string().trim().max(300, "Bio must be 300 characters or less"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user } = useSession();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { enabled: notificationsEnabled, registering: registeringNotifications, enableNotifications } = usePushNotifications(user?.id);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    full_name: "",
    university: "UNILORIN",
    department: "",
    level: "",
    matric_number: "",
    phone: "",
    bio: "",
  });

  const { data } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: p }, { data: v }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("verifications").select("status").eq("user_id", user!.id).maybeSingle(),
      ]);
      return { profile: p, verified: v?.status === "APPROVED" };
    },
  });
  const { data: isAdmin } = useQuery({
    queryKey: ["admin-role", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: role, error } = await supabase.from("user_roles").select("id").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      if (error) throw error;
      return !!role;
    },
  });
  const p = data?.profile;

  useEffect(() => {
    if (!p || editing) return;
    setForm({
      full_name: p.full_name,
      university: p.university,
      department: p.department ?? "",
      level: p.level ?? "",
      matric_number: p.matric_number ?? "",
      phone: p.phone ?? "",
      bio: p.bio ?? "",
    });
  }, [editing, p]);

  const set = (key: keyof ProfileForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function saveProfile() {
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ ...parsed.data, bio: parsed.data.bio || null }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    setEditing(false);
    toast.success("Profile updated");
  }

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["admin-pending-verifications"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { count, error } = await supabase.from("verifications").select("id", { count: "exact", head: true }).eq("status", "PENDING");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const rows: [string, string | null | undefined][] = [
    ["University", universityLabel(p?.university)],
    ["Department", p?.department],
    ["Level", p?.level],
    ["Matric #", p?.matric_number],
    ["Phone", p?.phone],
    ["Bio", p?.bio ?? "Not set"],
  ];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-10" style={{ paddingTop: insets.top }}>
      <Card>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">{p?.full_name ?? "My profile"}</Text>
            <Text className="text-muted-foreground">{p?.email}</Text>
          </View>
          {!editing && (
            <Button variant="ghost" className="h-10 w-10 px-0" accessibilityLabel="Edit profile" onPress={() => setEditing(true)}>
              <Pencil size={17} color="#1B2436" />
            </Button>
          )}
          {data?.verified ? (
            <Badge variant="success">
              <View className="flex-row items-center gap-1">
                <BadgeCheck size={12} color="#FCFCFC" />
                <Text className="text-xs font-medium text-success-foreground">Verified</Text>
              </View>
            </Badge>
          ) : (
            <Badge variant="outline">
              <View className="flex-row items-center gap-1">
                <ShieldAlert size={12} color="#1B2436" />
                <Text className="text-xs font-medium text-foreground">Unverified</Text>
              </View>
            </Badge>
          )}
        </View>

        {editing ? (
          <View className="mt-6 gap-4">
            <View>
              <Label>Full name</Label>
              <Input value={form.full_name} onChangeText={(value) => set("full_name", value)} />
            </View>
            <View>
              <Label>University</Label>
              <Select value={form.university} onChange={(value) => set("university", value)} options={UNIVERSITIES.map((u) => ({ value: u.value, label: u.label }))} />
            </View>
            <View>
              <Label>Department</Label>
              <Input value={form.department} onChangeText={(value) => set("department", value)} />
            </View>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Label>Level</Label>
                <Input value={form.level} onChangeText={(value) => set("level", value)} keyboardType="number-pad" />
              </View>
              <View className="flex-1">
                <Label>Matric #</Label>
                <Input value={form.matric_number} onChangeText={(value) => set("matric_number", value)} />
              </View>
            </View>
            <View>
              <Label>Phone</Label>
              <Input value={form.phone} onChangeText={(value) => set("phone", value)} keyboardType="phone-pad" />
            </View>
            <View>
              <Label>Bio</Label>
              <Textarea value={form.bio} onChangeText={(value) => set("bio", value)} placeholder="Tell buyers a little about yourself" />
            </View>
            <View className="flex-row gap-3">
              <Button className="flex-1" onPress={saveProfile} loading={saving}>Save changes</Button>
              <Button variant="outline" className="flex-1" onPress={() => setEditing(false)} disabled={saving}>Cancel</Button>
            </View>
          </View>
        ) : (
          <View className="mt-6 flex-row flex-wrap gap-3">
            {rows.map(([k, v]) => (
              <View key={k} className="w-[47%] rounded-xl bg-muted p-3">
                <Text className="text-xs uppercase tracking-wide text-muted-foreground">{k}</Text>
                <Text className="mt-1 font-medium text-foreground">{v || "Not set"}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {!data?.verified && (
        <Button className="mt-4" onPress={() => router.push("/verify")}>
          Go to verification
        </Button>
      )}

      {isAdmin && (
        <View>
          <Button variant="outline" className="mt-4" onPress={() => router.push("/admin/verifications")}>
            <View className="flex-row items-center gap-2">
              <ShieldAlert size={16} color="#1B2436" />
              <Text className="font-semibold text-foreground">Review verifications</Text>
              {pendingCount > 0 && (
                <View className="ml-1 rounded-full bg-destructive px-2 py-0.5">
                  <Text className="text-xs font-bold text-destructive-foreground">{pendingCount > 99 ? "99+" : pendingCount}</Text>
                </View>
              )}
            </View>
          </Button>
          <Button variant="outline" className="mt-3" onPress={() => router.push("/admin/reports")}>Review listing reports</Button>
        </View>
      )}

      <Button variant="outline" className="mt-4" onPress={() => router.push("/settings")}>
        <View className="flex-row items-center gap-2">
          <Settings size={16} color="#1B2436" />
          <Text className="font-semibold text-foreground">Settings</Text>
        </View>
      </Button>

      <Button
        variant="outline"
        className="mt-4"
        loading={registeringNotifications}
        disabled={notificationsEnabled}
        onPress={() => enableNotifications().catch((error) => toast.error(error instanceof Error ? error.message : "Could not enable notifications"))}
      >
        <View className="flex-row items-center gap-2">
          <Bell size={16} color="#1B2436" />
          <Text className="font-semibold text-foreground">{notificationsEnabled ? "Notifications enabled" : "Enable notifications"}</Text>
        </View>
      </Button>

      <Button
        variant="outline"
        className="mt-4"
        onPress={() => supabase.auth.signOut()}
      >
        <View className="flex-row items-center gap-2">
          <LogOut size={16} color="#1B2436" />
          <Text className="font-semibold text-foreground">Sign out</Text>
        </View>
      </Button>
    </ScrollView>
  );
}
