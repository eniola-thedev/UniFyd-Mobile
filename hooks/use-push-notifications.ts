import { useState } from "react";
import { Platform } from "react-native";
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
  const [enabled, setEnabled] = useState(false);

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
      const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
      if (!permission.granted) throw new Error("Notification permission was not granted");

      const projectId = process.env.EXPO_PUBLIC_EXPO_PROJECT_ID ?? Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) throw new Error("Expo project ID is missing. Configure EAS before enabling push notifications.");

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      const { error } = await supabase.from("push_tokens").upsert(
        { user_id: userId, token, platform: Platform.OS },
        { onConflict: "user_id,token" },
      );
      if (error) throw error;
      setEnabled(true);
    } finally {
      setRegistering(false);
    }
  }

  return { enabled, registering, enableNotifications };
}
