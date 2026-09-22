import { useState } from "react";
import { Alert, View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { Flag, Heart, X } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";
import { useSavedListings } from "@/hooks/use-saved-listings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListingImage } from "@/components/listing-image";
import { conditionLabel, formatNaira, livingLabel, universityLabel } from "@/lib/constants";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";

const STATUS_NOTE: Record<string, string> = {
  PAYMENT_PENDING: "This listing is saved but not yet visible to buyers. Payment for the plan is the next step.",
  DRAFT: "This listing is a draft and is not visible to buyers.",
  SOLD: "This item has been marked as sold.",
  EXPIRED: "This listing has expired. Reactivate it to make it visible again.",
  REMOVED: "This listing was removed.",
};

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [active, setActive] = useState(0);
  const { savedIds, toggleSaved, isToggling } = useSavedListings();
  const toast = useToast();
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [sendingOffer, setSendingOffer] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("SCAM");
  const [reportDescription, setReportDescription] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [paying, setPaying] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: seller } = useQuery({
    queryKey: ["seller", listing?.seller_id],
    enabled: !!listing?.seller_id,
    queryFn: async () =>
      (
        await supabase
          .from("profiles")
          .select("full_name, university")
          .eq("id", listing!.seller_id)
          .maybeSingle()
      ).data,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-background p-4">
        <View className="aspect-square rounded-2xl bg-muted" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-2xl font-bold text-foreground">Listing not available</Text>
        <Text className="mt-2 text-center text-muted-foreground">It may have been sold or removed.</Text>
        <Button className="mt-5" onPress={() => router.replace("/(tabs)")}>
          Back to marketplace
        </Button>
      </View>
    );
  }

  const isOwner = listing.seller_id === user?.id;
  const images = listing.images ?? [];
  const note = STATUS_NOTE[listing.status];

  async function submitOffer() {
    if (!user) return toast.error("Sign in to make an offer");
    if (!listing) return toast.error("Listing not available");
    const amount = Number(offerAmount.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) return toast.error("Enter a valid offer amount");
    if (!offerMessage.trim()) return toast.error("Add a short message with your offer");
    setSendingOffer(true);
    const { error } = await supabase.from("offers").insert({ listing_id: listing.id, buyer_id: user.id, amount, message: offerMessage.trim() });
    setSendingOffer(false);
    if (error) return toast.error(error.message);
    setOfferOpen(false);
    setOfferAmount("");
    setOfferMessage("");
    toast.success("Offer sent to the seller");
  }

  async function submitReport() {
    if (!user) return toast.error("Sign in to report a listing");
    if (!listing) return toast.error("Listing not available");
    setSendingReport(true);
    const { error } = await supabase.from("reports").insert({
      listing_id: listing.id,
      reporter_id: user.id,
      reported_user_id: listing.seller_id,
      reason: reportReason,
      description: reportDescription.trim() || null,
    });
    setSendingReport(false);
    if (error) return toast.error(error.code === "23505" ? "You have already reported this listing" : error.message);
    setReportOpen(false);
    setReportDescription("");
    toast.success("Report submitted for review");
  }

  async function completePayment() {
    if (!user) return toast.error("Sign in to complete payment");
    if (!listing) return toast.error("Listing not available");
    setPaying(true);
    try {
      const { data: checkout, error: checkoutError } = await supabase.functions.invoke("create-listing-payment", {
        body: { listingId: listing.id },
      });
      if (checkoutError) throw checkoutError;
      if (checkout?.free) {
        await queryClient.invalidateQueries({ queryKey: ["listing", id] });
        return toast.success("Your free listing is now live for 3 days.");
      }
      if (!checkout?.authorizationUrl || !checkout?.reference || !checkout?.returnUrl) {
        throw new Error("Could not start the payment checkout");
      }
      const result = await WebBrowser.openAuthSessionAsync(checkout.authorizationUrl, checkout.returnUrl);
      if (result.type !== "success") return toast.error("Payment was cancelled. Your listing is still saved.");
      const { error: verificationError } = await supabase.functions.invoke("verify-listing-payment", {
        body: { reference: checkout.reference },
      });
      if (verificationError) throw verificationError;
      await queryClient.invalidateQueries({ queryKey: ["listing", id] });
      toast.success("Payment confirmed. Your listing is now live.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not complete payment");
    } finally {
      setPaying(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-10">
      {note && (
        <View className="mb-4 rounded-xl border border-border bg-muted p-3">
          <Text className="text-sm text-foreground">{note}</Text>
        </View>
      )}

      <View className="aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
        <ListingImage path={images[active] ?? null} />
      </View>

      {images.length > 1 && (
        <View className="mt-3 flex-row gap-2">
          {images.map((p, i) => (
            <Pressable
              key={p}
              onPress={() => setActive(i)}
              className={`h-16 w-16 overflow-hidden rounded-lg border ${i === active ? "border-primary" : "border-border"}`}
            >
              <ListingImage path={p} />
            </Pressable>
          ))}
        </View>
      )}

      <View className="mt-5 flex-row flex-wrap gap-2">
        <Badge variant="outline">{listing.category}</Badge>
        <Badge variant="outline">{conditionLabel(listing.condition)}</Badge>
        {listing.is_featured && <Badge>Featured</Badge>}
        {listing.is_clearance && <Badge variant="muted">Clearance</Badge>}
      </View>

      <View className="mt-3 flex-row items-start gap-3">
        <Text className="flex-1 text-2xl font-bold text-foreground">{listing.title}</Text>
        <Pressable
          accessibilityLabel={savedIds.has(listing.id) ? "Remove from saved listings" : "Save listing"}
          onPress={() => toggleSaved(listing.id)}
          disabled={isToggling}
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-white"
        >
          <Heart size={21} color={savedIds.has(listing.id) ? "#D6362E" : "#1B2436"} fill={savedIds.has(listing.id) ? "#D6362E" : "transparent"} />
        </Pressable>
      </View>
      <Text className="mt-1 text-3xl font-bold text-primary">{formatNaira(Number(listing.price))}</Text>
      <Text className="mt-1 text-sm text-muted-foreground">{listing.negotiable ? "Open to offers" : "Fixed price"}</Text>

      <View className="mt-6 gap-1.5">
        <Text className="text-sm text-foreground">
          <Text className="text-muted-foreground">Campus: </Text>
          {universityLabel(listing.university)}
        </Text>
        <Text className="text-sm text-foreground">
          <Text className="text-muted-foreground">Living type: </Text>
          {livingLabel(listing.living_type)}
        </Text>
        <Text className="text-sm text-foreground">
          <Text className="text-muted-foreground">Area: </Text>
          {listing.hostel_area}
        </Text>
      </View>

      <View className="mt-6">
        <Text className="text-lg font-semibold text-foreground">Description</Text>
        <Text className="mt-2 text-muted-foreground">{listing.description}</Text>
      </View>

      {seller && (
        <Card className="mt-6">
          <Text className="text-xs uppercase tracking-wide text-muted-foreground">Seller</Text>
          <Text className="mt-1 font-medium text-foreground">{seller.full_name}</Text>
          <Text className="text-sm text-muted-foreground">{universityLabel(seller.university)}</Text>
        </Card>
      )}

      <Button variant="ghost" className="mt-5 self-start" onPress={() => setReportOpen((open) => !open)}>
        <View className="flex-row items-center gap-2"><Flag size={16} color="#D6362E" /><Text className="font-semibold text-destructive">Report this listing</Text></View>
      </Button>

      {reportOpen && (
        <Card className="mt-2 gap-3">
          <View className="flex-row items-center justify-between"><Text className="text-lg font-semibold text-foreground">Report listing</Text><Pressable accessibilityLabel="Close report form" onPress={() => setReportOpen(false)}><X size={18} color="#697182" /></Pressable></View>
          <Label>Reason</Label>
          <Select value={reportReason} onChange={setReportReason} options={[{ value: "SCAM", label: "Possible scam" }, { value: "COUNTERFEIT", label: "Counterfeit item" }, { value: "PROHIBITED", label: "Prohibited item" }, { value: "HARASSMENT", label: "Harassment" }, { value: "OTHER", label: "Other" }]} />
          <Label>Details (optional)</Label>
          <Textarea value={reportDescription} onChangeText={setReportDescription} placeholder="Tell moderators what looks wrong" />
          <Button variant="destructive" onPress={submitReport} loading={sendingReport}>Submit report</Button>
        </Card>
      )}

      <View className="mt-6 flex-row flex-wrap gap-3">
        {isOwner ? (
          <>
            {listing.status === "PAYMENT_PENDING" && <Button onPress={completePayment} loading={paying}>{listing.plan === "FREE" ? "Publish free listing" : "Pay to publish"}</Button>}
            <Button variant="outline" onPress={() => router.push("/my-listings")}>
              Manage my listings
            </Button>
          </>
        ) : (
          <>
            {listing.negotiable && (
              <Button variant="outline" onPress={() => setOfferOpen((open) => !open)}>
                Make an offer
              </Button>
            )}
            <Button
              onPress={() =>
              router.push({
                pathname: "/messages/[id]",
                params: { id: listing.id, receiverId: listing.seller_id },
              })
            }
          >
            Message the seller
            </Button>
          </>
        )}
        <Button variant="outline" onPress={() => router.replace("/(tabs)")}>
          Back to marketplace
        </Button>
      </View>
      {offerOpen && !isOwner && (
        <Card className="mt-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">Make an offer</Text>
            <Pressable accessibilityLabel="Close offer form" onPress={() => setOfferOpen(false)}><X size={18} color="#697182" /></Pressable>
          </View>
          <View><Label>Offer amount in Naira</Label><Input value={offerAmount} onChangeText={setOfferAmount} keyboardType="numeric" placeholder={String(listing.price)} /></View>
          <View><Label>Message</Label><Textarea value={offerMessage} onChangeText={setOfferMessage} placeholder="Tell the seller when you can complete the purchase." /></View>
          <Button onPress={submitOffer} loading={sendingOffer}>Send offer</Button>
        </Card>
      )}
    </ScrollView>
  );
}
