import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, Image } from "react-native";
import { Link, useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { UNIVERSITIES } from "@/lib/constants";

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter your phone number").max(20),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  university: z.enum(["UNILORIN", "AL_HIKMAH", "KWASU", "UNIOSUN"]),
  department: z.string().trim().min(2).max(80),
  level: z.string().trim().min(1).max(10),
  matric_number: z.string().trim().min(3).max(30),
});

export default function SignUp() {
  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    university: "UNILORIN",
    department: "",
    level: "",
    matric_number: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit() {
    const parsed = signUpSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { data: p } = parsed;
    const referralCode = await AsyncStorage.getItem("unifyd-referral-code");
    const { data, error } = await supabase.auth.signUp({
      email: p.email,
      password: p.password,
      options: {
        data: {
          full_name: p.full_name,
          phone: p.phone,
          university: p.university,
          department: p.department,
          level: p.level,
          matric_number: p.matric_number,
          referral_code: referralCode ?? undefined,
        },
      },
    });
    setLoading(false);
    if (error) {
      const message = error.message.toLowerCase();
      return toast.error(
        message.includes("already") || message.includes("duplicate") || message.includes("database error")
          ? "An account with this email or matric number already exists. Sign in instead."
          : error.message,
      );
    }
    await AsyncStorage.removeItem("unifyd-referral-code");
    // If email confirmation is required, the session will be null and the user
    // needs to confirm before they can access the app.
    if (!data.session) {
      return toast.success("Account created! Check your email to confirm your address, then sign in.");
    }
    toast.success("Account created, welcome to UniFyd Market!");
    router.replace("/verify");
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerClassName="px-6 py-10" keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Image
            source={require("../../assets/Sign up illustration.png")}
            style={{ width: 250, height: 210 }}
            resizeMode="contain"
          />
        </View>

        <Text className="text-2xl font-bold text-foreground">Create your student account</Text>
        <Text className="mt-1 text-sm text-muted-foreground">Free to join. You'll verify your student ID next.</Text>

        <View className="mt-6 gap-4">
          <View>
            <Label>Full name</Label>
            <Input value={form.full_name} onChangeText={(v) => set("full_name", v)} placeholder="Ada Lovelace" />
          </View>
          <View>
            <Label>Email</Label>
            <Input
              value={form.email}
              onChangeText={(v) => set("email", v)}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
          </View>
          <View>
            <Label>Phone</Label>
            <Input value={form.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" placeholder="080…" />
          </View>
          <View>
            <Label>Password</Label>
            <View className="relative">
              <Input
                value={form.password}
                onChangeText={(v) => set("password", v)}
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
          <View>
            <Label>University</Label>
            <Select
              value={form.university}
              onChange={(v) => set("university", v)}
              options={UNIVERSITIES.map((u) => ({ value: u.value, label: u.label }))}
            />
          </View>
          <View>
            <Label>Department</Label>
            <Input value={form.department} onChangeText={(v) => set("department", v)} placeholder="Software Engineering" />
          </View>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Label>Level</Label>
              <Input value={form.level} onChangeText={(v) => set("level", v)} placeholder="e.g. 300" keyboardType="number-pad" />
            </View>
            <View className="flex-1">
              <Label>Matric #</Label>
              <Input value={form.matric_number} onChangeText={(v) => set("matric_number", v)} placeholder="22/03SEN010" />
            </View>
          </View>
          <Button onPress={onSubmit} loading={loading}>
            Create account
          </Button>
        </View>

        <View className="mt-8 flex-row justify-center gap-1">
          <Text className="text-sm text-muted-foreground">Already have an account?</Text>
          <Link href="/(auth)/sign-in">
            <Text className="text-sm font-semibold text-primary">Sign in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
