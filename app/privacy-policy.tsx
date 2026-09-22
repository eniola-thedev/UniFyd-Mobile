import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SECTIONS = [
  {
    title: "1. Overview",
    body:
      'UniFyd ("we", "our", "us") operates the UniFyd Market mobile app. This Privacy Policy explains what information we collect, how we use it, and how we protect it.',
  },
  {
    title: "2. Information we collect",
    body:
      "Account details: your name, email, phone number, university, department, level, and matric number, provided during signup. Verification data: a photo of your student ID card, stored in a private storage bucket and visible only to you and our review team. Device information: push notification tokens, platform, and app version. Usage data: listings you view, messages you send, and offers you make.",
  },
  {
    title: "3. How we use your information",
    body:
      "To create and manage your account. To verify your student identity before you can publish listings. To show you relevant listings from your own and other campuses. To power messaging, offers, and push notifications. To enforce our Terms of Service and prevent fraud or abuse. To process payments for paid listing plans.",
  },
  {
    title: "4. Sharing your information",
    body:
      "We do not sell your personal data. We share information only as follows: with other users, when necessary to operate the marketplace (for example, your name and university appear on listings you post); with our payment processor (Paystack) to complete transactions; with our infrastructure provider (Supabase) who stores your data on secure servers; and with regulators or law enforcement when required by law.",
  },
  {
    title: "5. Storage and security",
    body:
      "Your account credentials and session are protected by Supabase Auth and stored securely on your device using encrypted storage. Student ID photos are stored in a private bucket with signed URLs that expire after one hour. We use row-level security so users can only access their own data. However, no online service is completely secure, and we cannot guarantee absolute protection.",
  },
  {
    title: "6. Biometric authentication",
    body:
      "If you enable Face ID or fingerprint, we store only a flag and your email address securely on your device. The biometric data itself is never stored by UniFyd; it is managed by your device's operating system.",
  },
  {
    title: "7. Push notifications",
    body:
      "If you enable notifications, we store your Expo push token so we can deliver messages and offer alerts. You can disable notifications at any time in Settings.",
  },
  {
    title: "8. Your rights",
    body:
      "You may access, correct, or delete your personal data by contacting support@unifyd.app. After verification, we will delete your account and associated data within 30 days, except where we are required to retain it for legal or fraud-prevention purposes.",
  },
  {
    title: "9. Children",
    body:
      "UniFyd is not intended for anyone under the age of 16. We do not knowingly collect data from children.",
  },
  {
    title: "10. Changes to this policy",
    body:
      "We may update this Privacy Policy from time to time. The last update date is shown at the top. Continued use of the app means you accept the updated policy.",
  },
  {
    title: "11. Contact us",
    body:
      "If you have questions about this policy, email support@unifyd.app.",
  },
];

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12" style={{ paddingTop: insets.top }}>
      <Text className="text-2xl font-bold text-foreground">Privacy Policy</Text>
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