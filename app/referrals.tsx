import { useMemo } from "react";
import { Share, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Gift, Share2, Users } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/auth-context";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatNaira } from "@/lib/constants";

type Referral = { id: string; referred_user_id: string; status: string; created_at: string };
type Reward = { id: string; amount: number; status: string; currency: string };

export default function Referrals() {
  const { user } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["referral-dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: profile, error: profileError }, { data: referrals, error: referralsError }, { data: rewards, error: rewardsError }] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("id", user!.id).maybeSingle(),
        supabase.from("referrals").select("id, referred_user_id, status, created_at").eq("referrer_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("referral_rewards").select("id, amount, status, currency").eq("referrer_id", user!.id),
      ]);
      if (profileError || referralsError || rewardsError) throw profileError ?? referralsError ?? rewardsError;
      return { code: profile?.referral_code ?? null, referrals: (referrals ?? []) as Referral[], rewards: (rewards ?? []) as Reward[] };
    },
  });

  const summary = useMemo(() => {
    const referrals = data?.referrals ?? [];
    const rewards = data?.rewards ?? [];
    return {
      invited: referrals.length,
      verified: referrals.filter((referral) => ["VERIFIED", "QUALIFIED", "REWARDED"].includes(referral.status)).length,
      qualified: referrals.filter((referral) => ["QUALIFIED", "REWARDED"].includes(referral.status)).length,
      pending: rewards.filter((reward) => reward.status === "PENDING" || reward.status === "APPROVED").reduce((sum, reward) => sum + Number(reward.amount), 0),
      paid: rewards.filter((reward) => reward.status === "PAID").reduce((sum, reward) => sum + Number(reward.amount), 0),
    };
  }, [data]);

  async function shareInvite() {
    if (!data?.code) return toast.error("Your referral code is not ready yet");
    const link = `uninest://invite/${data.code}`;
    await Share.share({ message: `Join me on UniFyd, the campus marketplace: ${link}`, url: link });
  }

  if (isLoading) return <View className="flex-1 bg-background p-4"><View className="h-64 rounded-2xl bg-muted" /></View>;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12">
      <Text className="text-2xl font-bold text-foreground">Invite & earn</Text>
      <Text className="mt-1 text-sm text-muted-foreground">Invite students and earn when they verify and complete a paid listing.</Text>

      <Card className="mt-5 items-center gap-3 bg-secondary">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary"><Gift size={28} color="#FCFCFC" /></View>
        <Text className="text-sm text-primary-foreground">Your referral code</Text>
        <Text className="text-3xl font-bold tracking-widest text-primary-foreground">{data?.code ?? "Generating"}</Text>
        <Button className="mt-2 bg-white" onPress={shareInvite}>
          <View className="flex-row items-center gap-2"><Share2 size={16} color="#1B2436" /><Text className="font-semibold text-foreground">Share invite link</Text></View>
        </Button>
      </Card>

      <View className="mt-4 flex-row gap-3">
        {[["Invited", summary.invited, Users], ["Verified", summary.verified, Gift], ["Qualified", summary.qualified, Copy]].map(([label, value, Icon]) => (
          <Card key={String(label)} className="flex-1 items-center p-3"><Icon size={17} color="#149A6B" /><Text className="mt-2 text-xl font-bold text-foreground">{value}</Text><Text className="text-xs text-muted-foreground">{label}</Text></Card>
        ))}
      </View>

      <Card className="mt-4 gap-3">
        <Text className="text-lg font-semibold text-foreground">Earnings</Text>
        <View className="flex-row justify-between"><Text className="text-muted-foreground">Pending</Text><Text className="font-semibold text-warning">{formatNaira(summary.pending)}</Text></View>
        <View className="flex-row justify-between"><Text className="text-muted-foreground">Paid</Text><Text className="font-semibold text-primary">{formatNaira(summary.paid)}</Text></View>
        <Badge variant="outline">Rewards stay pending until payment is confirmed.</Badge>
      </Card>

      <Card className="mt-4 gap-3">
        <Text className="text-lg font-semibold text-foreground">Referral activity</Text>
        {data?.referrals.length ? data.referrals.map((referral) => (
          <View key={referral.id} className="flex-row items-center justify-between border-b border-border py-3 last:border-b-0">
            <View><Text className="font-medium text-foreground">Student referral</Text><Text className="text-xs text-muted-foreground">{new Date(referral.created_at).toLocaleDateString()}</Text></View>
            <Badge variant={referral.status === "REWARDED" ? "success" : "outline"}>{referral.status}</Badge>
          </View>
        )) : <Text className="text-muted-foreground">No referrals yet. Share your link to get started.</Text>}
      </Card>

      <Button variant="outline" className="mt-6" onPress={() => router.back()}>Back</Button>
    </ScrollView>
  );
}
