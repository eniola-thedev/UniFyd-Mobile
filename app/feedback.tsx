import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useSession } from "@/hooks/auth-context";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";

const categories = [
  { value: "GENERAL", label: "Feedback" },
  { value: "FEATURE_REQUEST", label: "Feature idea" },
  { value: "BUG_REPORT", label: "Bug report" },
] as const;

type FeedbackCategory = (typeof categories)[number]["value"];

export default function FeedbackScreen() {
  const router = useRouter();
  const { user } = useSession();
  const toast = useToast();
  const [category, setCategory] = useState<FeedbackCategory>("GENERAL");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitFeedback() {
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 10) return toast.error("Please add a little more detail (at least 10 characters)");
    if (!user) return toast.error("Sign in to send feedback");

    setSubmitting(true);
    try {
      const { error } = await supabase.from("user_feedback").insert({
        user_id: user.id,
        category,
        message: trimmedMessage,
      });
      if (error) throw error;
      toast.success("Thanks. Your feedback has been sent.");
      router.back();
    } catch {
      toast.error("Could not send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-5 p-4 pb-12"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-sm text-muted-foreground">
        Share what’s working, what could be better, or what you’d like to see next.
      </Text>

      <View>
        <Text className="mb-2 text-sm font-medium text-foreground">What is this about?</Text>
        <View className="flex-row flex-wrap gap-2">
          {categories.map((option) => {
            const selected = category === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setCategory(option.value)}
                className={`min-h-11 flex-row items-center gap-2 rounded-xl border px-3 ${
                  selected ? "border-primary bg-accent" : "border-border bg-card"
                }`}
              >
                {selected ? <Check size={16} color="#149A6B" /> : null}
                <Text className={`text-sm font-medium ${selected ? "text-accent-foreground" : "text-foreground"}`}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Card className="gap-3 p-4">
        <Text className="text-sm font-medium text-foreground">Your message</Text>
        <Textarea
          accessibilityLabel="Your feedback or feature idea"
          value={message}
          onChangeText={setMessage}
          maxLength={2000}
          placeholder="Tell us what you think..."
          returnKeyType="default"
        />
        <Text className="text-right text-xs text-muted-foreground">{message.length}/2000</Text>
      </Card>

      <Button onPress={submitFeedback} loading={submitting}>
        Send feedback
      </Button>
    </ScrollView>
  );
}