import { useEffect, useState } from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";
import { useToast } from "@/components/ui/toast";
import { useSignedUrl } from "@/hooks/use-signed-url";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { UNIVERSITIES, universityLabel } from "@/lib/constants";

type Uni = "UNILORIN" | "AL_HIKMAH" | "KWASU" | "UNIOSUN";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter the name printed on your ID card").max(80),
  university: z.enum(["UNILORIN", "AL_HIKMAH", "KWASU", "UNIOSUN"]),
  department: z.string().trim().min(2, "Enter your department").max(80),
  level: z.string().trim().min(1, "Enter your level").max(10),
  matric_number: z.string().trim().min(3, "Enter your matric number").max(30),
});

const STATUS_COPY: Record<string, { label: string; text: string; variant: "success" | "destructive" | "outline" }> = {
  PENDING: { label: "Under review", text: "Your ID has been submitted. Reviews are usually completed within 24 hours.", variant: "outline" },
  APPROVED: { label: "Approved", text: "You are a verified seller. You can post listings now.", variant: "success" },
  REJECTED: { label: "Rejected", text: "Your submission was not accepted. Check the reviewer note, then submit a clearer photo.", variant: "destructive" },
};

export default function Verify() {
  const { user } = useSession();
  const qc = useQueryClient();
  const toast = useToast();
  const router = useRouter();

  const { data: v, isLoading } = useQuery({
    queryKey: ["verification", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("verifications").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const [form, setForm] = useState({ full_name: "", university: "UNILORIN" as Uni, department: "", level: "", matric_number: "" });
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, val: string) => setForm((f) => ({ ...f, [k]: val }));

  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      full_name: f.full_name || profile.full_name || "",
      university: (profile.university as Uni) || f.university,
      department: f.department || profile.department || "",
      level: f.level || profile.level || "",
      matric_number: f.matric_number || profile.matric_number || "",
    }));
  }, [profile]);

  const submittedIdUrl = useSignedUrl(v?.student_id_url ?? null);
  const status = v?.status ?? null;
  const canSubmit = !status || status === "REJECTED";

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast.error("Photo library access is needed to upload your ID");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (result.canceled) return;
    setAsset(result.assets[0]);
  }

  async function onSubmit() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!asset) return toast.error("Attach a photo of your student ID card");
    if (!user) return;

    setSaving(true);
    try {
      const ext = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
      const contentType = asset.mimeType ?? `image/${ext === "jpg" ? "jpeg" : ext}`;
      const key = `${user.id}/student-id-${Date.now()}.${ext}`;
      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();
      const { error: upErr } = await supabase.storage.from("student-ids").upload(key, arrayBuffer, { upsert: true, contentType });
      if (upErr) throw upErr;
      const path = `student-ids/${key}`;

      if (v) {
        const { error } = await supabase
          .from("verifications")
          .update({ ...parsed.data, student_id_url: path, status: "PENDING", notes: null, submitted_at: new Date().toISOString() })
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("verifications")
          .insert({ ...parsed.data, user_id: user.id, student_id_url: path, status: "PENDING" });
        if (error) throw error;
      }

      await supabase
        .from("profiles")
        .update({
          full_name: parsed.data.full_name,
          university: parsed.data.university,
          department: parsed.data.department,
          level: parsed.data.level,
          matric_number: parsed.data.matric_number,
        })
        .eq("id", user.id);

      setAsset(null);
      qc.invalidateQueries({ queryKey: ["verification", user.id] });
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Submitted for review");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your verification");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12" keyboardShouldPersistTaps="handled">
      <Text className="text-2xl font-bold text-foreground">Seller verification</Text>
      <Text className="mt-2 text-muted-foreground">
        Verification confirms you are a real student before you can publish a listing. Your ID photo is stored privately and is only
        visible to you and our reviewers.
      </Text>

      {isLoading && <View className="mt-6 h-24 rounded-2xl bg-muted" />}

      {status && (
        <Card className="mt-6">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-sm font-medium text-foreground">Status</Text>
            <Badge variant={STATUS_COPY[status]?.variant ?? "outline"}>{STATUS_COPY[status]?.label ?? status}</Badge>
          </View>
          <Text className="mt-3 text-sm text-muted-foreground">{STATUS_COPY[status]?.text}</Text>
          {v?.notes && (
            <View className="mt-3 rounded-xl bg-muted p-3">
              <Text className="text-sm text-foreground">Reviewer note: {v.notes}</Text>
            </View>
          )}
          <View className="mt-4 flex-row flex-wrap gap-3">
            {(
              [
                ["Name on ID", v?.full_name],
                ["University", universityLabel(v?.university)],
                ["Department", v?.department],
                ["Level", v?.level],
                ["Matric number", v?.matric_number],
              ] as [string, string | null | undefined][]
            ).map(([k, val]) => (
              <View key={k} className="w-[47%] rounded-xl bg-muted p-3">
                <Text className="text-xs uppercase tracking-wide text-muted-foreground">{k}</Text>
                <Text className="mt-1 font-medium text-foreground">{val || "Not set"}</Text>
              </View>
            ))}
          </View>
          {submittedIdUrl && (
            <Image source={{ uri: submittedIdUrl }} className="mt-4 h-56 w-full rounded-xl border border-border" resizeMode="contain" />
          )}
          {status === "APPROVED" && (
            <Button className="mt-5" onPress={() => router.push("/(tabs)/sell")}>
              Post a listing
            </Button>
          )}
        </Card>
      )}

      {canSubmit && (
        <Card className="mt-6 gap-4">
          <Text className="text-lg font-semibold text-foreground">{status === "REJECTED" ? "Submit again" : "Submit your details"}</Text>
          <View>
            <Label>Full name as printed on your ID</Label>
            <Input value={form.full_name} onChangeText={(v2) => set("full_name", v2)} />
          </View>
          <View>
            <Label>University</Label>
            <Select value={form.university} onChange={(v2) => set("university", v2 as Uni)} options={UNIVERSITIES.map((u) => ({ value: u.value, label: u.label }))} />
          </View>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Label>Department</Label>
              <Input value={form.department} onChangeText={(v2) => set("department", v2)} />
            </View>
            <View className="flex-1">
              <Label>Level</Label>
              <Input value={form.level} onChangeText={(v2) => set("level", v2)} placeholder="300" keyboardType="number-pad" />
            </View>
          </View>
          <View>
            <Label>Matric number</Label>
            <Input value={form.matric_number} onChangeText={(v2) => set("matric_number", v2)} />
          </View>
          <View>
            <Label>Photo of your student ID card</Label>
            <Button variant="outline" onPress={pickImage}>
              {asset ? "Change photo" : "Choose photo"}
            </Button>
            <Text className="mt-1 text-xs text-muted-foreground">
              Make sure your name, matric number and photo are readable.
            </Text>
          </View>
          {asset && <Image source={{ uri: asset.uri }} className="h-56 w-full rounded-xl border border-border" resizeMode="contain" />}
          <Button onPress={onSubmit} loading={saving}>
            Submit for review
          </Button>
        </Card>
      )}
    </ScrollView>
  );
}
