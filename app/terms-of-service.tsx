import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SECTIONS = [
  {
    title: "1. Acceptance of terms",
    body:
      "By creating a UniFyd account or using the app, you agree to these Terms of Service. If you do not agree, do not use the app.",
  },
  {
    title: "2. Eligibility",
    body:
      "UniFyd is intended for enrolled university students. You must be a student at one of our supported institutions and provide accurate academic details during signup.",
  },
  {
    title: "3. Verification",
    body:
      "To publish listings, you must verify your student identity by uploading a photo of your student ID card. Your ID is stored privately and is only visible to you and our review team. We may reject submissions that do not clearly show your name, matric number, or photo.",
  },
  {
    title: "4. Acceptable use",
    body:
      "You agree to: list only items you own or have permission to sell; provide accurate descriptions and pricing; not sell prohibited, illegal, or dangerous items; and treat other users respectfully. Prohibited items include weapons, drugs, counterfeit goods, and restricted academic materials.",
  },
  {
    title: "5. Listings and plans",
    body:
      "Each listing is assigned a plan (Free, Basic, Featured, or Clearance) that determines how long it is visible and how it appears in search. Free listings are limited to one item and last 3 days. Paid plans are purchased through in-app payments and are non-refundable unless the listing is removed by our team.",
  },
  {
    title: "6. Offers and deals",
    body:
      "Buyers may submit offers. Sellers may accept, reject, or counter. Once a seller accepts an offer, both parties must confirm the deal before the listing is marked as sold. We are not responsible for disputes between buyers and sellers.",
  },
  {
    title: "7. Payments",
    body:
      "Payments are processed by our third-party provider (Paystack). By using paid plans, you agree to their terms in addition to ours. We do not store your card details on this device.",
  },
  {
    title: "8. Account suspension and termination",
    body:
      "We may suspend or remove accounts that violate these terms, engage in fraudulent activity, or harm the community. Removed listings and banned accounts are not refunded.",
  },
  {
    title: "9. Changes to these terms",
    body:
      "We may update these Terms of Service from time to time. Continued use of the app after changes means you accept the updated terms.",
  },
  {
    title: "10. Governing law",
    body:
      "These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes will be resolved in the courts of Kwara State.",
  },
];

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12" style={{ paddingTop: insets.top }}>
      <Text className="text-2xl font-bold text-foreground">Terms of Service</Text>
      <Text className="mt-1 text-sm text-muted-foreground">Last updated: September 2026</Text>

      <Card className="mt-6 gap-4">
        {SECTIONS.map((section) => (
          <View key={section.title}>
            <Text className="text-base font-semibold text-foreground">{section.title}</Text>
            <Text className="mt-1 text-sm text-muted-foreground">{section.body}</Text>
          </View>
        ))}
      </Card>

      <Button variant="outline" className="mt-6" onPress={() => router.back()}>Back</Button>
    </ScrollView>
  );
}