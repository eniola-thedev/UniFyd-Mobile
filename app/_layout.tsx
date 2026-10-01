import "../global.css";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Platform, Text, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useSession } from "@/hooks/auth-context";
import { useAdminAccess } from "@/hooks/use-admin-access";
import { ThemeProvider, useTheme } from "@/hooks/use-theme";
import { ToastProvider } from "@/components/ui/toast";

const queryClient = new QueryClient();

function RootNavigator() {
  const { user, loading } = useSession();
  const { isAdmin, isLoading: loadingAdminAccess } = useAdminAccess();
  const segments = useSegments();
  const router = useRouter();
  const [launching, setLaunching] = useState(true);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.78)).current;

  useEffect(() => {
    if (Platform.OS === "web") {
      setLaunching(false);
      return;
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 7, tension: 55, useNativeDriver: true }),
      ]),
      Animated.delay(550),
      Animated.timing(logoOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setLaunching(false));
  }, [logoOpacity, logoScale]);

  useEffect(() => {
    if (loading || launching) return;
    if (user && loadingAdminAccess) return;
    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";
    const inAdminGroup = segments[0] === "admin";

    if (user && isAdmin && !inAdminGroup) {
      router.replace("/admin");
    } else if (user && !isAdmin && inAdminGroup) {
      router.replace("/(tabs)");
    } else if (user && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)");
    } else if (!user && !inAuthGroup && !inOnboarding) {
      router.replace("/onboarding");
    }
  }, [user, isAdmin, loadingAdminAccess, loading, launching, segments]);

  if (launching) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Animated.View className="items-center" style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <View className="h-20 w-20 items-center justify-center rounded-[24px] bg-primary shadow-lg">
            <Text className="text-4xl font-bold text-primary-foreground">U</Text>
          </View>
          <Text className="mt-5 text-3xl font-bold tracking-wide text-foreground">UniFyd</Text>
          <Text className="mt-1 text-sm text-muted-foreground">Campus marketplace</Text>
        </Animated.View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#149A6B" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="listing/[id]" options={{ headerShown: true, title: "Listing" }} />
      <Stack.Screen name="listing/edit/[id]" options={{ headerShown: true, title: "Edit listing" }} />
      <Stack.Screen name="verify" options={{ headerShown: true, title: "Get verified" }} />
      <Stack.Screen name="my-listings" options={{ headerShown: true, title: "My listings" }} />
      <Stack.Screen name="admin/verifications" options={{ headerShown: true, title: "Verification review" }} />
      <Stack.Screen name="admin/reports" options={{ headerShown: true, title: "Listing reports" }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings" }} />
      <Stack.Screen name="feedback" options={{ headerShown: true, title: "Share feedback" }} />
      <Stack.Screen name="invite/[code]" options={{ headerShown: false }} />
      <Stack.Screen name="offers/[id]" options={{ headerShown: true, title: "Offers" }} />
      <Stack.Screen name="referrals" options={{ headerShown: true, title: "Invite & earn" }} />
      <Stack.Screen name="about" options={{ headerShown: true, title: "About UniFyd" }} />
      <Stack.Screen name="terms-of-service" options={{ headerShown: true, title: "Terms of Service" }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: true, title: "Privacy Policy" }} />
      <Stack.Screen name="privacy-settings" options={{ headerShown: true, title: "Privacy & security" }} />
    </Stack>
  );
}

function ThemedRoot() {
  const { resolved } = useTheme();
  return (
    <GestureHandlerRootView className={`flex-1 ${resolved === "dark" ? "dark" : ""}`}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              <RootNavigator />
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedRoot />
    </ThemeProvider>
  );
}
