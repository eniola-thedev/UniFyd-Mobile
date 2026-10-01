import { useEffect, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(userId: string | undefined) {
  const [registering, setRegistering] = useState(false);
  const [checking, setChecking] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const tokenStorageKey = userId ? `unifyd-push-token:${userId}` : null;

  useEffect(() => {
    let active = true;
    async function checkRegistration() {
      if (!userId || Platform.OS === "web") {
        setEnabled(false);
        setChecking(false);
        return;
      }

      setChecking(true);
      try {
        const permission = await Notifications.getPermissionsAsync();
        if (!("granted" in permission) || !permission.granted) {
          if (active) setEnabled(false);
          return;
        }

        const projectId = process.env.EXPO_PUBLIC_EXPO_PROJECT_ID ?? Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
          if (active) setEnabled(false);
          return;
        }

        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        if (tokenStorageKey) await AsyncStorage.setItem(tokenStorageKey, token);
        const { data, error } = await supabase
          .from("push_tokens")
          .select("id")
          .eq("user_id", userId)
          .eq("token", token)
          .limit(1);
        if (error) throw error;
        if (active) setEnabled((data?.length ?? 0) > 0);
      } catch {
        if (active) setEnabled(false);
      } finally {
        if (active) setChecking(false);
      }
    }

    void checkRegistration();
    return () => {
      active = false;
    };
  }, [userId, tokenStorageKey]);

  async function enableNotifications() {
    if (!userId) throw new Error("You must be signed in to enable notifications");
    if (Platform.OS === "web") throw new Error("Push notifications require the mobile app");

    setRegistering(true);
    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "UniFyd",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const current = await Notifications.getPermissionsAsync();
      const isGranted = (response: typeof current) => "granted" in response && response.granted === true;
      const permission = isGranted(current) ? current : await Notifications.requestPermissionsAsync();
      if (!isGranted(permission)) {
        throw new Error("Notification permission was not granted");
      }

      const projectId = process.env.EXPO_PUBLIC_EXPO_PROJECT_ID ?? Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) throw new Error("Expo project ID is missing. Configure EAS before enabling push notifications.");

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      const { error } = await supabase.from("push_tokens").upsert(
        { user_id: userId, token, platform: Platform.OS },
        { onConflict: "user_id,token" },
      );
      if (error) throw error;
      if (tokenStorageKey) await AsyncStorage.setItem(tokenStorageKey, token).catch(() => {});
      setEnabled(true);
    } finally {
      setRegistering(false);
    }
  }

  async function disableNotifications() {
    if (!userId || Platform.OS === "web") throw new Error("Push notifications require the mobile app");
    setRegistering(true);
    try {
      const token = tokenStorageKey ? await AsyncStorage.getItem(tokenStorageKey) : null;
      if (token) {
        const { error } = await supabase.from("push_tokens").delete().eq("user_id", userId).eq("token", token);
        if (error) throw error;
        if (tokenStorageKey) await AsyncStorage.removeItem(tokenStorageKey);
      }
      setEnabled(false);
    } finally {
      setRegistering(false);
    }
  }

  return { enabled, registering, checking, enableNotifications, disableNotifications };
}
