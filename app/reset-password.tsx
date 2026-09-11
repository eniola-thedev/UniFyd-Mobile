import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const schema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

export default function ResetPassword() {
  const router = useRouter();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function updatePassword() {
    const parsed = schema.safeParse({ password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. You are signed in.");
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
        <View className="mb-8 items-center">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Text className="text-3xl font-bold text-primary-foreground">U</Text>
          </View>
          <Text className="mt-4 text-2xl font-bold text-foreground">Create a new password</Text>
          <Text className="mt-1 text-center text-sm text-muted-foreground">Choose a new password for your UniFyd account.</Text>
        </View>

        <View className="gap-4">
          <View>
            <Label>New password</Label>
            <View className="relative">
              <Input
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="At least 6 characters"
                className="pr-12"
              />
              <Pressable
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                onPress={() => setShowPassword((visible) => !visible)}
                className="absolute right-1 top-1 h-11 w-11 items-center justify-center"
              >
                {showPassword ? <EyeOff size={19} color="#697182" /> : <Eye size={19} color="#697182" />}
              </Pressable>
            </View>
          </View>
          <View>
            <Label>Confirm new password</Label>
            <View className="relative">
              <Input
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                placeholder="Repeat your new password"
                className="pr-12"
              />
              <Pressable
                accessibilityLabel={showConfirm ? "Hide password confirmation" : "Show password confirmation"}
                onPress={() => setShowConfirm((visible) => !visible)}
                className="absolute right-1 top-1 h-11 w-11 items-center justify-center"
              >
                {showConfirm ? <EyeOff size={19} color="#697182" /> : <Eye size={19} color="#697182" />}
              </Pressable>
            </View>
          </View>
          <Button onPress={updatePassword} loading={saving}>Update password</Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
