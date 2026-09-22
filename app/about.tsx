import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12" style={{ paddingTop: insets.top }}>
      <Text className="text-2xl font-bold text-foreground">About UniFyd</Text>
      <Text className="mt-1 text-sm text-muted-foreground">The campus marketplace built by students, for students.</Text>

      <View className="mt-6 items-center">
        <View className="h-20 w-20 items-center justify-center rounded-[24px] bg-primary shadow-lg">
          <Text className="text-4xl font-bold text-primary-foreground">U</Text>
        </View>
        <Text className="mt-4 text-xl font-bold text-foreground">UniFyd Market</Text>
        <Text className="text-sm text-muted-foreground">Version 1.0.0</Text>
      </View>

      <Card className="mt-6 gap-4">
        <View>
          <Text className="text-lg font-semibold text-foreground">Our mission</Text>
          <Text className="mt-2 text-muted-foreground">
            UniFyd gives university students a safe, trusted place to buy and sell second-hand items within their
            campus community. We verify every seller with their student ID so buyers can transact with confidence.
          </Text>
        </View>

        <View>
          <Text className="text-lg font-semibold text-foreground">How it works</Text>
          <View className="mt-2 gap-2">
            {[
              "Sign up with your university email and student details.",
              "Verify your identity by uploading your student ID card.",
              "Post listings, reply to offers, and chat with buyers or sellers.",
              "Use Face ID or fingerprint to keep your account secure.",
            ].map((step, index) => (
              <View key={index} className="flex-row items-start gap-3">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-accent">
                  <Text className="text-xs font-bold text-primary">{index + 1}</Text>
                </View>
                <Text className="flex-1 text-sm text-foreground">{step}</Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-lg font-semibold text-foreground">Supported universities</Text>
          <Text className="mt-2 text-muted-foreground">
            University of Ilorin, Al-Hikmah University, Kwara State University, and Osun State University.
          </Text>
        </View>

        <View>
          <Text className="text-lg font-semibold text-foreground">Contact us</Text>
          <Text className="mt-2 text-muted-foreground">support@unifyd.app</Text>
        </View>
      </Card>

      <Button variant="outline" className="mt-6" onPress={() => router.back()}>Back</Button>
    </ScrollView>
  );
}