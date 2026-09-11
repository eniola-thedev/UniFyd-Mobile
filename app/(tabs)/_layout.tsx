import { useQuery } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { Store, Heart, PlusCircle, MessagesSquare, User } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";

export default function TabsLayout() {
  const { user } = useSession();
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-message-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user!.id)
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#149A6B",
        tabBarInactiveTintColor: "#697182",
        tabBarStyle: { borderTopColor: "#E7E8EC" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Marketplace", tabBarIcon: ({ color, size }) => <Store color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="saved"
        options={{ title: "Saved", tabBarIcon: ({ color, size }) => <Heart color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="sell"
        options={{ title: "Sell", tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: "#D6362E", color: "#FCFCFC" },
          tabBarIcon: ({ color, size }) => <MessagesSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tabs>
  );
}
