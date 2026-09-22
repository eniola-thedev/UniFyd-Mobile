import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Share, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BookOpen,
  ChevronRight,
  CircleHelp,
  FileText,
  Globe,
  Gift,
  Info,
  KeyRound,
  LogOut,
  Moon,
  Palette,
  Shield,
  Smartphone,
  UserRound,
  Bug,
  GraduationCap,
  Heart,
  Sun,
  Fingerprint,
  ScanFace,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";
import { useTheme, type ThemeMode } from "@/hooks/use-theme";
import { useToast } from "@/components/ui/toast";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useBiometrics } from "@/hooks/use-biometrics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Switch } from "@/components/ui/card";
import { universityLabel } from "@/lib/constants";

function SettingRow({
  icon: Icon,
  label,
  detail,
  onPress,
  trailing,
}: {
  icon: typeof Bell;
  label: string;
  detail?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} className="flex-row items-center gap-3 border-b border-border py-4 last:border-b-0">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-accent">
        <Icon size={17} color="#215240" />
      </View>
      <View className="flex-1">
        <Text className="font-medium text-foreground">{label}</Text>
        {detail && <Text className="mt-0.5 text-xs text-muted-foreground">{detail}</Text>}
      </View>
      {trailing ?? (onPress ? <ChevronRight size={18} color="#697182" /> : null)}
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-6">
      <Text className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</Text>
      <Card className="py-1">{children}</Card>
    </View>
  );
}

export default function Settings() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useSession();
  const { enabled: notificationsEnabled, registering: registeringNotifications, enableNotifications } = usePushNotifications(user?.id);
  const { mode: appearance, resolved, setMode: setAppearance } = useTheme();
  const biometrics = useBiometrics();
  const [assignmentReminders, setAssignmentReminders] = useState(true);
  const [examReminders, setExamReminders] = useState(true);
  const [announcements, setAnnouncements] = useState(true);
  const [messages, setMessages] = useState(true);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("full_name, university, department, level, referral_code").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

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
      toast.success(`${biometrics.getBiometricLabel(biometrics.biometricType)} enabled for sign-in`);
    } else {
      await biometrics.disable();
      toast.success("Biometric sign-in disabled");
    }
  }

  async function chooseAppearance(value: ThemeMode) {
    setAppearance(value);
    if (value === "dark") toast.success("Dark theme enabled");
    else if (value === "light") toast.success("Light theme enabled");
    else toast.success("Theme follows system");
  }

  function showComingSoon(label: string) {
    toast.success(`${label} is coming in the next UniFyd update`);
  }

  function reportProblem() {
    Alert.alert("Report a problem", "Tell us what went wrong and we will help you fix it.", [
      { text: "Cancel", style: "cancel" },
      { text: "Email support", onPress: () => void Linking.openURL("mailto:support@unifyd.app?subject=UniFyd%20problem") },
    ]);
  }

  async function inviteFriend() {
    if (!profile?.referral_code) return toast.error("Your invite code is not ready yet");
    const link = `uninest://invite/${profile.referral_code}`;
    await Share.share({
      message: `Join me on UniFyd, the campus marketplace. Use my invite link: ${link}`,
      url: link,
    });
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12">
      <Text className="text-2xl font-bold text-foreground">Settings</Text>
      <Text className="mt-1 text-sm text-muted-foreground">Manage your UniFyd account and app preferences.</Text>

      <Section title="Account">
        <SettingRow icon={UserRound} label="Profile" detail={profile?.full_name ?? "View your profile"} onPress={() => router.push("/(tabs)/profile")} />
        <SettingRow icon={UserRound} label="Edit profile" onPress={() => router.push("/(tabs)/profile")} />
        <SettingRow icon={KeyRound} label="Change password" detail="Send a secure reset link to your email" onPress={() => {
          if (!user?.email) return toast.error("No email is attached to this account");
          void supabase.auth.resetPasswordForEmail(user.email).then(({ error }) => error ? toast.error(error.message) : toast.success("Password reset link sent"));
        }} />
        <SettingRow icon={Smartphone} label="Email / Phone" detail={user?.email ?? "Manage contact details"} onPress={() => router.push("/(tabs)/profile")} />
        <SettingRow icon={LogOut} label="Log out" onPress={() => void supabase.auth.signOut()} />
      </Section>

      <Section title="App preferences">
        <SettingRow
          icon={Bell}
          label="Notifications"
          detail={notificationsEnabled ? "Enabled on this device" : "Not enabled"}
          onPress={() => enableNotifications().catch((error) => toast.error(error instanceof Error ? error.message : "Could not enable notifications"))}
          trailing={<Switch value={notificationsEnabled} onValueChange={() => void enableNotifications().catch((error) => toast.error(error instanceof Error ? error.message : "Could not enable notifications"))} />}
        />
        <SettingRow icon={BookOpen} label="Assignment reminders" trailing={<Switch value={assignmentReminders} onValueChange={setAssignmentReminders} />} />
        <SettingRow icon={BookOpen} label="Exam reminders" trailing={<Switch value={examReminders} onValueChange={setExamReminders} />} />
        <SettingRow icon={Bell} label="Announcements" trailing={<Switch value={announcements} onValueChange={setAnnouncements} />} />
        <SettingRow icon={Bell} label="Messages" trailing={<Switch value={messages} onValueChange={setMessages} />} />
        <SettingRow
          icon={resolved === "dark" ? Moon : Sun}
          label="Appearance"
          detail={
            appearance === "system"
              ? `Follows system (${resolved === "dark" ? "Dark" : "Light"})`
              : appearance === "dark"
                ? "Dark theme"
                : "Light theme"
          }
          onPress={() =>
            Alert.alert("Appearance", "Choose your preferred appearance.", [
              { text: "Light", onPress: () => void chooseAppearance("light") },
              { text: "Dark", onPress: () => void chooseAppearance("dark") },
              { text: "System", onPress: () => void chooseAppearance("system") },
              { text: "Cancel", style: "cancel" },
            ])
          }
          trailing={
            <Switch
              value={resolved === "dark"}
              onValueChange={(next) => void chooseAppearance(next ? "dark" : "light")}
            />
          }
        />
        <SettingRow icon={Globe} label="Language" detail="English" onPress={() => showComingSoon("Additional languages")} />
        <SettingRow icon={Smartphone} label="Data usage" detail="Standard image quality" onPress={() => showComingSoon("Data usage controls")} />
      </Section>

      <Section title="Academic">
        <SettingRow icon={GraduationCap} label="University / Institution" detail={universityLabel(profile?.university)} onPress={() => router.push("/(tabs)/profile")} />
        <SettingRow icon={BookOpen} label="Department" detail={profile?.department ?? "Not set"} onPress={() => router.push("/(tabs)/profile")} />
        <SettingRow icon={GraduationCap} label="Level" detail={profile?.level ?? "Not set"} onPress={() => router.push("/(tabs)/profile")} />
        <SettingRow icon={BookOpen} label="Academic session" detail="Not set" onPress={() => showComingSoon("Academic session settings")} />
        <SettingRow icon={BookOpen} label="Semester" detail="Not set" onPress={() => showComingSoon("Semester settings")} />
      </Section>

      <Section title="Personalization">
        <SettingRow icon={Palette} label="Campus communities" detail="Coming soon" onPress={() => showComingSoon("Campus communities")} />
        <SettingRow icon={Heart} label="Courses and classmates" detail="Coming soon" onPress={() => showComingSoon("Courses and classmates")} />
        <SettingRow icon={BookOpen} label="Events and assignments" detail="Coming soon" onPress={() => showComingSoon("Events and assignments")} />
      </Section>

      <Section title="Invite & earn">
        <SettingRow icon={Gift} label="Referral dashboard" detail="Track invites and rewards" onPress={() => router.push("/referrals")} />
        <SettingRow icon={Heart} label="Invite a friend" detail="Earn after your friend verifies and completes a paid listing" onPress={inviteFriend} />
        <SettingRow icon={Info} label="Your referral code" detail={profile?.referral_code ?? "Generating..."} />
        <View className="px-1 py-3">
          <Badge variant="outline">Rewards are pending until payment is confirmed</Badge>
        </View>
      </Section>

      <Section title="Privacy & security">
        <SettingRow icon={Shield} label="Privacy settings" onPress={() => router.push("/privacy-settings")} />
        <SettingRow icon={UserRound} label="Profile visibility" detail="Visible to marketplace users" onPress={() => router.push("/privacy-settings")} />
        <SettingRow icon={Shield} label="Security" detail="Your session is protected by Supabase Auth" onPress={() => router.push("/privacy-settings")} />
        <SettingRow
          icon={biometrics.biometricType === "FACE_ID" || biometrics.biometricType === "FACE_RECOGNITION" ? ScanFace : Fingerprint}
          label="Biometric sign-in"
          detail={
            !biometrics.isAvailable
              ? "Not available on this device"
              : biometrics.isEnabled
                ? `Enabled (${biometrics.getBiometricLabel(biometrics.biometricType)})`
                : `Use ${biometrics.getBiometricLabel(biometrics.biometricType)} to sign in`
          }
          trailing={
            <Switch
              value={biometrics.isEnabled}
              onValueChange={toggleBiometric}
              disabled={!biometrics.isAvailable}
            />
          }
        />
        <SettingRow icon={Smartphone} label="Active sessions" onPress={() => showComingSoon("Active session management")} />
        <SettingRow icon={Bug} label="Report a problem" onPress={reportProblem} />
      </Section>

      <Section title="Support">
        <SettingRow icon={CircleHelp} label="Help center" onPress={() => showComingSoon("Help center")} />
        <SettingRow icon={Info} label="Contact support" onPress={() => void Linking.openURL("mailto:support@unifyd.app")} />
        <SettingRow icon={Bug} label="Report a bug" onPress={reportProblem} />
        <SettingRow icon={Heart} label="Rate UniFyd" onPress={() => showComingSoon("App store rating")}/>
      </Section>

      <Section title="About">
        <SettingRow icon={Info} label="About UniFyd" onPress={() => router.push("/about")} />
        <SettingRow icon={FileText} label="Terms of service" onPress={() => router.push("/terms-of-service")} />
        <SettingRow icon={Shield} label="Privacy policy" onPress={() => router.push("/privacy-policy")} />
        <SettingRow icon={Info} label="App version" detail="1.0.0" />
      </Section>

      <Button variant="outline" className="mt-6" onPress={() => router.back()}>Back</Button>
    </ScrollView>
  );
}
