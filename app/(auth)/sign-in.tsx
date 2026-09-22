import { useState } from "react";
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, Image } from "react-native";
import { Link, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { Eye, EyeOff, Fingerprint, ScanFace } from "lucide-react-native";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useBiometrics } from "@/hooks/use-biometrics";

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});

export default function SignIn() {
  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const biometrics = useBiometrics();

  async function onSubmit() {
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
  }

  async function handleBiometricSignIn() {
    if (!biometrics.enrolledEmail) return;
    const ok = await biometrics.authenticate("Confirm your identity to sign in to UniFyd");
    if (!ok) return;
    setLoading(true);
    try {
      // Restore the persisted Supabase session (stored securely by expo-secure-store).
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        router.replace("/(tabs)");
        return;
      }
      toast.error("No saved session. Sign in with your password first.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot() {
    if (!email) return toast.error("Enter your email first");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL("reset-password"),
    });
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent to your email");
    setShowForgot(false);
  }

  // Component references used in JSX must be capitalized, otherwise React
  // treats them as literal host tags (e.g. <biometricicon>) and throws an
  // "invalid element type" error at render time.
  const BiometricIcon = biometrics.biometricType === "FACE_ID" || biometrics.biometricType === "FACE_RECOGNITION"
    ? ScanFace
    : Fingerprint;
  const biometricLabel = biometrics.getBiometricLabel(biometrics.biometricType);

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
        <View className="mb-8 self-center">
          <Text className="text-lg font-bold text-foreground">
            UniFyd <Text className="text-primary">Market</Text>
          </Text>
        </View>

        <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Image
            source={require("../../assets/Sign in Illustration.png")}
            style={{ width: 250, height: 210 }}
            resizeMode="contain"
          />
        </View>

        <Text className="text-2xl font-bold text-foreground">{showForgot ? "Reset your password" : "Welcome back"}</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          {showForgot ? "We'll email you a reset link." : "Sign in to your student account."}
        </Text>

        <View className="mt-6 gap-4">
          <View>
            <Label>Email</Label>
            <Input
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
          </View>
          {!showForgot && (
            <View>
              <Label>Password</Label>
              <View className="relative">
                <Input
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
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
          )}
          <Button onPress={showForgot ? handleForgot : onSubmit} loading={loading}>
            {showForgot ? "Send reset link" : "Sign in"}
          </Button>

          {!showForgot && biometrics.isEnabled && biometrics.enrolledEmail && (
            <Button
              variant="outline"
              loading={loading}
              onPress={handleBiometricSignIn}
            >
              <View className="flex-row items-center gap-2">
                {BiometricIcon ? <BiometricIcon size={18} color="#149A6B" /> : null}
                <Text className="font-semibold text-foreground">Sign in with {biometricLabel}</Text>
              </View>
            </Button>
          )}
          <Pressable onPress={() => setShowForgot((v) => !v)}>
            <Text className="text-center text-sm text-muted-foreground">
              {showForgot ? "Back to sign in" : "Forgot password?"}
            </Text>
          </Pressable>
        </View>

        <View className="mt-8 flex-row justify-center gap-1">
          <Text className="text-sm text-muted-foreground">New to UniFyd?</Text>
          <Link href="/(auth)/sign-up">
            <Text className="text-sm font-semibold text-primary">Create account</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}