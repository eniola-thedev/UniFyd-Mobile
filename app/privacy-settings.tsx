import { useState } from "react";
import { ScrollView, View, Text, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Shield, Lock, Trash2, Download } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";
import { useToast } from "@/components/ui/toast";
import { useBiometrics } from "@/hooks/use-biometrics";
import { Button } from "@/components/ui/button";
import { Card, Switch } from "@/components/ui/card";
import { universityLabel } from "@/lib/constants";

export default function PrivacySettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useSession();
  const toast = useToast();
  const biometrics = useBiometrics();

  const [profileVisible, setProfileVisible] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  async function toggleBiometric(next: boolean) {
    if (next) {
      if (!biometrics.isAvailable) {
        toast.error("Face ID or fingerprint is not available on this device");
        return;
      }
      const ok = await biometrics.authenticate("Enable biometric sign-in");
      if (!ok) return;
      if (!user?.email) {
        toast.error("No email is attached to this account");
        return;
      }
      await biometrics.enable(user.email);
      toast.success(`${biometrics.getBiometricLabel(biometrics.biometricType)} enabled`);
    } else {
      await biometrics.disable();
      toast.success("Biometric sign-in disabled");
    }
  }

  async function deleteAccount() {
    Alert.alert(
      "Delete your account?",
      "This will permanently remove your profile, listings, messages, and saved items. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.auth.deleteUser();
              if (error) throw error;
              toast.success("Account deleted");
              router.replace("/(auth)/sign-in");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not delete account");
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12" style={{ paddingTop: insets.top }}>
      <Text className="text-2xl font-bold text-foreground">Privacy & security</Text>
      <Text className="mt-1 text-sm text-muted-foreground">Control how your information is shared and protected.</Text>

      <Card className="mt-6 gap-4">
        <Text className="text-lg font-semibold text-foreground">Account security</Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-medium text-foreground">Biometric sign-in</Text>
            <Text className="text-xs text-muted-foreground">
              {biometrics.isAvailable
                ? biometrics.isEnabled
                  ? `Enabled (${biometrics.getBiometricLabel(biometrics.biometricType)})`
                  : `Use ${biometrics.getBiometricLabel(biometrics.biometricType)}`
                  : "Not available on this device"}
            </Text>
          </View>
          <Switch
            value={biometrics.isEnabled}
            onValueChange={toggleBiometric}
            disabled={!biometrics.isAvailable}
          />
        </View>
        <Button variant="outline" onPress={() => router.push("/reset-password")}>
          <View className="flex-row items-center gap-2">
            <Lock size={16} color="#1B2436" />
            <Text className="font-semibold text-foreground">Change password</Text>
          </View>
        </Button>
      </Card>

      <Card className="mt-4 gap-4">
        <Text className="text-lg font-semibold text-foreground">Profile visibility</Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-medium text-foreground">Show profile to marketplace users</Text>
            <Text className="text-xs text-muted-foreground">Your name and university appear on listings you post.</Text>
          </View>
          <Switch value={profileVisible} onValueChange={setProfileVisible} />
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-medium text-foreground">Show online status</Text>
            <Text className="text-xs text-muted-foreground">Let others see when you are active.</Text>
          </View>
          <Switch value={showOnlineStatus} onValueChange={setShowOnlineStatus} />
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-medium text-foreground">Allow messages from anyone</Text>
            <Text className="text-xs text-muted-foreground">If off, only verified sellers can message you.</Text>
          </View>
          <Switch value={allowMessages} onValueChange={setAllowMessages} />
        </View>
      </Card>

      <Card className="mt-4 gap-4">
        <Text className="text-lg font-semibold text-foreground">Data & analytics</Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-medium text-foreground">Share anonymous usage data</Text>
            <Text className="text-xs text-muted-foreground">Help us improve UniFyd. No personal data is shared.</Text>
          </View>
          <Switch value={dataSharing} onValueChange={setDataSharing} />
        </View>
        <Button variant="outline" onPress={() => router.push("/privacy-policy")}>
          <View className="flex-row items-center gap-2">
            <Shield size={16} color="#1B2436" />
            <Text className="font-semibold text-foreground">Read full privacy policy</Text>
          </View>
        </Button>
      </Card>

      <Card className="mt-4 gap-4">
        <Text className="text-lg font-semibold text-foreground">Download your data</Text>
        <Text className="text-sm text-muted-foreground">
          Request a copy of your profile, listings, messages, and saved items.
        </Text>
        <Button variant="outline" onPress={() => toast.success("Data export request received. You will receive an email shortly.")}>
          <View className="flex-row items-center gap-2">
            <Download size={16} color="#1B2436" />
            <Text className="font-semibold text-foreground">Request data export</Text>
          </View>
        </Button>
      </Card>

      <Card className="mt-4 gap-4">
        <Text className="text-lg font-semibold text-foreground">Delete account</Text>
        <Text className="text-sm text-muted-foreground">
          Permanently removes your profile, listings, messages, and saved items. This action cannot be undone.
        </Text>
        <Button variant="destructive" onPress={deleteAccount}>
          <View className="flex-row items-center gap-2">
            <Trash2 size={16} color="#FCFCFC" />
            <Text className="font-semibold text-destructive-foreground">Delete my account</Text>
          </View>
        </Button>
      </Card>

      <Button variant="outline" className="mt-6" onPress={() => router.back()}>Back</Button>
    </ScrollView>
  );
}