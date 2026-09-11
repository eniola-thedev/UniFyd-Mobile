import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/components/ui/button";

export default function InviteLanding() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();

  useEffect(() => {
    if (code) void AsyncStorage.setItem("unifyd-referral-code", code);
  }, [code]);

  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <View className="h-20 w-20 items-center justify-center rounded-[24px] bg-primary">
        <Text className="text-4xl font-bold text-primary-foreground">U</Text>
      </View>
      <Text className="mt-5 text-3xl font-bold text-foreground">Join UniFyd</Text>
      <Text className="mt-2 text-center text-muted-foreground">You were invited to join your campus marketplace.</Text>
      <Button className="mt-6 w-full" onPress={() => router.replace("/(auth)/sign-up")}>Create account</Button>
      <Button variant="outline" className="mt-3 w-full" onPress={() => router.replace("/(auth)/sign-in")}>I already have an account</Button>
    </View>
  );
}
