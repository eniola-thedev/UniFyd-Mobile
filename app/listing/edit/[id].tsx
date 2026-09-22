import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label, Switch, Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { CATEGORIES, CONDITIONS, LIVING_TYPES, UNIVERSITIES } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type Listing = Database["public"]["Tables"]["listings"]["Row"];
type Uni = "UNILORIN" | "AL_HIKMAH" | "KWASU" | "UNIOSUN";
type Living = "SCHOOL_HOSTEL" | "OFF_CAMPUS_HOSTEL" | "PRIVATE_APARTMENT";
type Cond = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR";

const schema = z.object({
  title: z.string().trim().min(4, "Give your item a clear title").max(90),
  description: z.string().trim().min(20, "Describe the item in at least 20 characters").max(2000),
  category: z.string().min(1, "Pick a category"),
  condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR"]),
  price: z.coerce.number().positive("Enter a price above zero").max(100_000_000),
  university: z.enum(["UNILORIN", "AL_HIKMAH", "KWASU", "UNIOSUN"]),
  living_type: z.enum(["SCHOOL_HOSTEL", "OFF_CAMPUS_HOSTEL", "PRIVATE_APARTMENT"]),
  hostel_area: z.string().trim().min(2, "Say where the item can be seen").max(80),
});

const CATEGORY_OPTIONS = CATEGORIES.flatMap((group) => group.items.map((item) => ({ value: item, label: item, group: group.group })));

export default function EditListing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [negotiable, setNegotiable] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    condition: "GOOD" as Cond,
    price: "",
    university: "UNILORIN" as Uni,
    living_type: "SCHOOL_HOSTEL" as Living,
    hostel_area: "",
  });

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("id", id).eq("seller_id", user!.id).maybeSingle();
      if (error) throw error;
      return data as Listing | null;
    },
  });

  useEffect(() => {
    if (!listing) return;
    setForm({
      title: listing.title,
      description: listing.description,
      category: listing.category,
      condition: listing.condition,
      price: String(listing.price),
      university: listing.university,
      living_type: listing.living_type,
      hostel_area: listing.hostel_area,
    });
    setNegotiable(listing.negotiable);
  }, [listing]);

  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function saveListing() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!user || !id) return;
    setSaving(true);
    const { error } = await supabase
      .from("listings")
      .update({ ...parsed.data, negotiable })
      .eq("id", id)
      .eq("seller_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["listing", id] }),
      queryClient.invalidateQueries({ queryKey: ["my-listings", user.id] }),
      queryClient.invalidateQueries({ queryKey: ["listings"] }),
    ]);
    toast.success("Listing updated");
    router.back();
  }

  if (isLoading) {
    return <View className="flex-1 bg-background p-4"><View className="h-64 rounded-2xl bg-muted" /></View>;
  }

  if (!listing) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-lg font-semibold text-foreground">Listing not found</Text>
        <Button className="mt-4" onPress={() => router.back()}>Go back</Button>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12" keyboardShouldPersistTaps="handled">
      <Text className="text-2xl font-bold text-foreground">Edit listing</Text>
      <Text className="mt-1 text-sm text-muted-foreground">Update the details buyers see. Your existing photos and plan stay unchanged.</Text>

      <Card className="mt-5 gap-4">
        <View>
          <Label>Title</Label>
          <Input value={form.title} onChangeText={(value) => set("title", value)} />
        </View>
        <View>
          <Label>Description</Label>
          <Textarea value={form.description} onChangeText={(value) => set("description", value)} />
        </View>
        <View>
          <Label>Category</Label>
          <Select value={form.category} onChange={(value) => set("category", value)} options={CATEGORY_OPTIONS} />
        </View>
        <View>
          <Label>Condition</Label>
          <Select value={form.condition} onChange={(value) => set("condition", value as Cond)} options={CONDITIONS} />
        </View>
        <View>
          <Label>Price in Naira</Label>
          <Input value={form.price} onChangeText={(value) => set("price", value)} keyboardType="numeric" />
        </View>
        <View className="flex-row items-center justify-between rounded-xl border border-border p-3">
          <View className="flex-1 pr-3">
            <Label className="mb-0">Open to offers</Label>
            <Text className="text-xs text-muted-foreground">Buyers can send a price offer.</Text>
          </View>
          <Switch value={negotiable} onValueChange={setNegotiable} />
        </View>
      </Card>

      <Card className="mt-4 gap-4">
        <View>
          <Label>University</Label>
          <Select value={form.university} onChange={(value) => set("university", value as Uni)} options={UNIVERSITIES.map((u) => ({ value: u.value, label: u.label }))} />
        </View>
        <View>
          <Label>Living type</Label>
          <Select value={form.living_type} onChange={(value) => set("living_type", value as Living)} options={LIVING_TYPES} />
        </View>
        <View>
          <Label>Hostel or area name</Label>
          <Input value={form.hostel_area} onChangeText={(value) => set("hostel_area", value)} />
        </View>
      </Card>

      <View className="mt-6 flex-row gap-3">
        <Button className="flex-1" onPress={saveListing} loading={saving}>Save changes</Button>
        <Button variant="outline" className="flex-1" onPress={() => router.back()} disabled={saving}>Cancel</Button>
      </View>
    </ScrollView>
  );
}
