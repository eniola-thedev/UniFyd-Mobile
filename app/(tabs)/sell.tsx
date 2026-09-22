import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { X } from "lucide-react-native";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label, Switch, Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { CATEGORIES, COMING_SOON_LISTING_PLANS, CONDITIONS, LISTING_PLANS, LIVING_TYPES, UNIVERSITIES, formatNaira } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type Uni = "UNILORIN" | "AL_HIKMAH" | "KWASU" | "UNIOSUN";
type Living = "SCHOOL_HOSTEL" | "OFF_CAMPUS_HOSTEL" | "PRIVATE_APARTMENT";
type Cond = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR";
type Plan = "FREE" | "BASIC" | "FEATURED" | "CLEARANCE";

const MAX_IMAGES = 5;

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

const CATEGORY_OPTIONS = CATEGORIES.flatMap((g) => g.items.map((it) => ({ value: it, label: it, group: g.group })));

export default function Sell() {
  const { user } = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const { data: verification, isLoading: loadingV } = useQuery({
    queryKey: ["verification", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("verifications").select("status").eq("user_id", user!.id).maybeSingle()).data,
  });
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("university").eq("id", user!.id).maybeSingle()).data,
  });

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
  const [negotiable, setNegotiable] = useState(true);
  const [plan, setPlan] = useState<Plan>("FREE");
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, val: string) => setForm((f) => ({ ...f, [k]: val }));

  useEffect(() => {
    if (profile?.university) setForm((f) => ({ ...f, university: profile.university as Uni }));
  }, [profile]);

  const { data: freeListingEligible } = useQuery({
    queryKey: ["free-listing-eligible", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", user!.id);
      if (error) throw error;
      return (count ?? 0) === 0;
    },
  });

  useEffect(() => {
    if (freeListingEligible === false && plan === "FREE") setPlan("BASIC");
  }, [freeListingEligible, plan]);

  async function pickImages() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast.error("Photo library access is needed to add pictures");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.8,
    });
    if (result.canceled) return;
    setImages((prev) => {
      const next = [...prev, ...result.assets].slice(0, MAX_IMAGES);
      if (prev.length + result.assets.length > MAX_IMAGES) toast.error(`You can add up to ${MAX_IMAGES} photos`);
      return next;
    });
  }

  async function onSubmit() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (images.length === 0) return toast.error("Add at least one photo of the item");
    if (!user) return;

    setSaving(true);
    try {
      const paths: string[] = [];
      for (const [i, asset] of images.entries()) {
        const ext = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
        const contentType = asset.mimeType ?? `image/${ext === "jpg" ? "jpeg" : ext}`;
        const key = `${user.id}/${Date.now()}-${i}.${ext}`;
        const response = await fetch(asset.uri);
        const arrayBuffer = await response.arrayBuffer();
        const { error } = await supabase.storage
          .from("listing-images")
          .upload(key, arrayBuffer, { contentType, upsert: false });
        if (error) throw error;
        paths.push(`listing-images/${key}`);
      }

      const { data, error } = await supabase
        .from("listings")
        .insert({
          seller_id: user.id,
          title: parsed.data.title,
          description: parsed.data.description,
          category: parsed.data.category,
          condition: parsed.data.condition,
          price: parsed.data.price,
          university: parsed.data.university,
          living_type: parsed.data.living_type,
          hostel_area: parsed.data.hostel_area,
          negotiable,
          plan: plan as Database["public"]["Enums"]["listing_plan"],
          is_clearance: plan === "CLEARANCE",
          status: "PAYMENT_PENDING",
          images: paths,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { data: checkout, error: checkoutError } = await supabase.functions.invoke("create-listing-payment", {
        body: { listingId: data.id },
      });
      if (checkoutError) throw checkoutError;
      if (checkout?.free) {
        toast.success("Your free listing is now live for 3 days.");
      } else if (!checkout?.authorizationUrl || !checkout?.reference || !checkout?.returnUrl) {
        throw new Error("Could not start the payment checkout");
      } else {
        const result = await WebBrowser.openAuthSessionAsync(checkout.authorizationUrl, checkout.returnUrl);
        if (result.type === "success") {
          const { error: verificationError } = await supabase.functions.invoke("verify-listing-payment", {
            body: { reference: checkout.reference },
          });
          if (verificationError) throw verificationError;
          toast.success("Payment confirmed. Your listing is now live.");
        } else {
          toast.success("Listing saved. Complete payment whenever you are ready.");
        }
      }
      router.push(`/listing/${data.id}`);
      setForm({ title: "", description: "", category: "", condition: "GOOD", price: "", university: form.university, living_type: "SCHOOL_HOSTEL", hostel_area: "" });
      setImages([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your listing");
    } finally {
      setSaving(false);
    }
  }

  if (loadingV) {
    return (
      <View className="flex-1 bg-background p-4" style={{ paddingTop: insets.top }}>
        <View className="h-40 rounded-2xl bg-muted" />
      </View>
    );
  }

  if (verification?.status !== "APPROVED") {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6" style={{ paddingTop: insets.top }}>
        <Card className="w-full">
          <Text className="text-2xl font-bold text-foreground">Get verified to sell</Text>
          <Text className="mt-2 text-muted-foreground">
            {verification?.status === "PENDING"
              ? "Your student ID is being reviewed. You can post a listing as soon as it is approved."
              : verification?.status === "REJECTED"
                ? "Your last verification was rejected. Submit a clearer photo of your student ID to continue."
                : "Only verified students can publish listings. Upload your student ID to get started."}
          </Text>
          <View className="mt-5 flex-row flex-wrap gap-3">
            <Button onPress={() => router.push("/verify")}>Go to verification</Button>
            <Button variant="outline" onPress={() => router.push("/(tabs)")}>
              Browse marketplace
            </Button>
          </View>
        </Card>
      </View>
    );
  }

  const selectedPlan = LISTING_PLANS.find((p) => p.value === plan)!;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12" style={{ paddingTop: insets.top }} keyboardShouldPersistTaps="handled">
      <Text className="text-2xl font-bold text-foreground">Post a listing</Text>
      <Text className="mt-1 text-muted-foreground">Listings run for 30 days once the plan is paid for.</Text>

      <Card className="mt-5 gap-4">
        <Text className="text-lg font-semibold text-foreground">Item details</Text>
        <View>
          <Label>Title</Label>
          <Input value={form.title} onChangeText={(v) => set("title", v)} placeholder="HP Pavilion laptop, 8GB RAM" />
        </View>
        <View>
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChangeText={(v) => set("description", v)}
            placeholder="What is included, how long you have used it, any faults a buyer should know about."
          />
        </View>
        <View>
          <Label>Category</Label>
          <Select value={form.category} onChange={(v) => set("category", v)} options={CATEGORY_OPTIONS} placeholder="Choose a category" />
        </View>
        <View>
          <Label>Condition</Label>
          <Select value={form.condition} onChange={(v) => set("condition", v as Cond)} options={CONDITIONS} />
        </View>
        <View>
          <Label>Price in Naira</Label>
          <Input value={form.price} onChangeText={(v) => set("price", v)} keyboardType="numeric" placeholder="35000" />
        </View>
        <View className="flex-row items-center justify-between rounded-xl border border-border p-3">
          <View className="flex-1 pr-3">
            <Label className="mb-0">Open to offers</Label>
            <Text className="text-xs text-muted-foreground">Buyers can send a price offer.</Text>
          </View>
          <Switch value={negotiable} onValueChange={setNegotiable} />
        </View>
      </Card>

      <Card className="mt-4 gap-3">
        <Text className="text-lg font-semibold text-foreground">Photos</Text>
        <Button variant="outline" onPress={pickImages}>
          Add photos
        </Button>
        <Text className="text-xs text-muted-foreground">Up to {MAX_IMAGES} photos. The first photo is your cover.</Text>
        {images.length > 0 && (
          <View className="flex-row flex-wrap gap-2">
            {images.map((img, i) => (
              <View key={img.uri} className="relative h-20 w-20 overflow-hidden rounded-xl border border-border">
                <Image source={{ uri: img.uri }} className="h-full w-full" />
                <Pressable
                  onPress={() => setImages((f) => f.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-1"
                >
                  <X size={12} color="#1B2436" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card className="mt-4 gap-4">
        <Text className="text-lg font-semibold text-foreground">Where buyers can see it</Text>
        <View>
          <Label>University</Label>
          <Select value={form.university} onChange={(v) => set("university", v as Uni)} options={UNIVERSITIES.map((u) => ({ value: u.value, label: u.label }))} />
        </View>
        <View>
          <Label>Living type</Label>
          <Select value={form.living_type} onChange={(v) => set("living_type", v as Living)} options={LIVING_TYPES} />
        </View>
        <View>
          <Label>Hostel or area name</Label>
          <Input value={form.hostel_area} onChangeText={(v) => set("hostel_area", v)} placeholder="Fagbewesa, Block C" />
        </View>
      </Card>

      <Card className="mt-4 gap-3">
        <Text className="text-lg font-semibold text-foreground">Listing plan</Text>
        {LISTING_PLANS.map((p) => (
          <Pressable
            key={p.value}
            onPress={() => p.value !== "FREE" || freeListingEligible !== false ? setPlan(p.value) : undefined}
            disabled={p.value === "FREE" && freeListingEligible === false}
            className={`rounded-xl border p-4 ${plan === p.value ? "border-primary bg-accent" : "border-border"} ${p.value === "FREE" && freeListingEligible === false ? "opacity-50" : ""}`}
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-medium text-foreground">{p.name}</Text>
              <Text className="font-semibold text-foreground">{formatNaira(p.price)}</Text>
            </View>
            <Text className="mt-1 text-sm text-muted-foreground">{p.perks.join(". ")}.</Text>
          </Pressable>
        ))}
        <Text className="text-sm text-muted-foreground">
          {selectedPlan.price === 0
            ? "Free listings are for new users only, limited to one item, and become visible immediately for 3 days."
            : `Your listing is saved and waits for payment of ${formatNaira(selectedPlan.price)}. It becomes visible to buyers once payment is confirmed.`}
        </Text>
        {COMING_SOON_LISTING_PLANS.map((item) => (
          <View key={item.name} className="rounded-xl border border-border bg-muted p-4 opacity-70">
            <View className="flex-row items-center justify-between"><Text className="font-medium text-foreground">{item.name}</Text><Text className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-muted-foreground">Coming soon</Text></View>
            <Text className="mt-1 text-sm text-muted-foreground">{item.description}</Text>
          </View>
        ))}
      </Card>

      <View className="mt-6 flex-row gap-3">
        <Button className="flex-1" onPress={onSubmit} loading={saving}>
          Save listing
        </Button>
      </View>
    </ScrollView>
  );
}
